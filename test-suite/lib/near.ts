import { NetworkConfig } from "./config"
import { Account, utils, keyStores, Near } from "near-api-js"
import { AccountBalance } from "near-api-js/lib/account"
import { NAMED_ACCOUNT_MAX_LENGTH } from "./constants"
import { ACCOUNT_ID_TOO_BIG } from "./errors"
import { NearConncetion } from "./near-connection"
import { BN } from "bn.js"
import { Logger } from "./logger"
import {_ContractSpec} from "./contract"
import { readFileSync } from "fs"
import path from "path"
import { assert, isString } from "utilities"

export function getSubAccName(name: string, parentAccName: string) {
  let result = name + "." + parentAccName
  assert(result.length <= NAMED_ACCOUNT_MAX_LENGTH, ACCOUNT_ID_TOO_BIG + " is " + result.length)
  return result
}

export async function getAccFromFile(file: string, connection: NearConncetion): Promise<Account> {
  let keyFile: { secret_key: string, private_key: string, account_id: string }
  try {
    keyFile = JSON.parse(readFileSync(file).toString())
  }
  catch (e) {
    throw Error(`file: ${file} not found`)
  }

  let key = keyFile.secret_key || keyFile.private_key
  let name = keyFile.account_id
  return await getExistentAcc(name, connection, getKeyPair(key))
}
interface KeyFile {
  secret_key?: string
  private_key?: string
  account_id: string
}
export type PrivKey = string
export function getKeyPair(privKey: string) {
  return utils.KeyPair.fromString(privKey)
}

export async function getKey(account: Account, connection : NearConncetion): Promise<PrivKey>{
  let key = await connection.keyStore.getKey(connection.networkId, account.accountId)
  return key.toString()
}

export async function getExistentAcc(name: string, connection: NearConncetion, keyPair: utils.key_pair.KeyPair | string): Promise<Account> {
  if (isString(keyPair)){
    keyPair = getKeyPair(keyPair)
  }
  await connection.keyStore.setKey(connection.networkId, name, keyPair)
  return await connection.near.account(name)
}
export async function createSubAccount(masterAccount: Account, connection: NearConncetion, name?: string, props?: { nameSuffixLength?: number, accountIdlength?: number, near?: number }): Promise<Account> {
  let times = 0
  let accountName: string
  let run = async () => {
    // get final name of account
    if (name) {
      if (props?.nameSuffixLength) {
        let length = NAMED_ACCOUNT_MAX_LENGTH - masterAccount.accountId.length - name.length - 1
        length = length > props.nameSuffixLength ? props.nameSuffixLength : length
        assert(length > 0, ACCOUNT_ID_TOO_BIG + " is " + length)
        let id = makeRandomid(length)
        accountName = getSubAccName(name + "_" + id, masterAccount.accountId)
      }
      else {
        assert(name.length + masterAccount.accountId.length + 1 <= NAMED_ACCOUNT_MAX_LENGTH, ACCOUNT_ID_TOO_BIG + " is " + name.length + masterAccount.accountId.length)
        accountName = getSubAccName(name, masterAccount.accountId)
      }
    }
    else {
      accountName = getSubAccName(makeRandomid(props?.accountIdlength || NAMED_ACCOUNT_MAX_LENGTH - masterAccount.accountId.length), masterAccount.accountId)
    }

    let masterKey = await connection.keyStore.getKey(connection.networkId, masterAccount.accountId)
    await connection.keyStore.setKey(connection.networkId, accountName, masterKey)
    let transfer = props?.near ? utils.format.parseNearAmount(String(props.near)) : "0"
    await masterAccount.createAccount(
      accountName,
      masterKey.getPublicKey(),
      new BN(transfer ? transfer : "0")
    );
  }
  try {
    await run()
  } catch (e) {
    if (times < 5)
    times++
    await run()
    Logger.error("error creating account: " + e, true)
    throw Error("error creating account: " + e)
  }
  let account = await connection.near.account(accountName!)
  Logger.info("account created: " + account.accountId, true)
  return account
}


export async function getKeyPairOfAcc(accountId: string, connection: NearConncetion) {
  return await connection.keyStore.getKey(connection.networkId, accountId)
}

export async function deployContract(contractAccount: Account, contract: _ContractSpec) {
  await contractAccount.deployContract(readFileSync(path.join(global.__dirname, "res", contract.wasmName)))
  let msg = `contract ${contract.name} deployed at ${contractAccount.accountId}`
  Logger.info(msg, true)
}

function makeRandomid(length: number) {
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyz';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }

  return result;
}
export async function deleteAccounts(accounts: Account[], beneficiary: Account) {
  for (let i = 0; i < accounts.length; i++) {
    try {
      accounts[i].deleteAccount(beneficiary.accountId)
    } catch (e) {
      Logger.error("Error deleting " + accounts[i].accountId, true)
    }
  }
}