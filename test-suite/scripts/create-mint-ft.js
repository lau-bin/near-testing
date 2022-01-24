const nearAPI = require("near-api-js");
const BN = require("bn.js");
const fs = require("fs");
const readline = require('readline');
const path = require("path");
const Contract = require("../util/contract");
const { assert } = require("console");
const vm = require('vm');
const util = require("../util/util")

const GAS_NORMAL = "3000000000000"
const networkOptions = {
  local: Symbol(),
  testnet: Symbol()

}
var keyStore;
var near;
const NETWORK = (process.env.NETWORK === "local" && networkOptions.local) || 
                (process.env.NETWORK === "testnet" && networkOptions.testnet) ||
                console.err("Bad network env") | process.exit(1)
const config = (() => {
  switch (NETWORK) {
    case networkOptions.local:
      return {
        networkId: "sandbox",
        nodeUrl: "http://localhost:3030",
        existentAcc: {
          master: {
            keyPath: "/tmp/near-sandbox/validator_key.json",
          }
        }
      }
    case networkOptions.testnet:
      return {
        networkId: "testnet",
        nodeUrl: "https://rpc.testnet.near.org",
        existentAcc: {
          master: {
            keyPath: process.env.TEST_ACCOUNT || (console.log("Path to testnet account credentials not found, it's usually found at /home/.near-credentials") | process.exit(1))
          }
        }
      }
  }
})()

function getSubAccName(name, parentAcc) {
  return name + "." + parentAcc.accountId
}
const contracts = {
  ft: {
    name: "ft",
    viewMethods: [
      "storage_minimum_balance",
      "storage_balance_of",
      "ft_metadata"
    ],
    changeMethods: [
      "new",
      "mint",
      "storage_deposit",
      "storage_withdraw",
      "ft_transfer_call",
      "ft_transfer"
    ],
    file: "ft_for_launcher.wasm"
  }
}

async function initNear() {
  keyStore = new nearAPI.keyStores.InMemoryKeyStore();
  near = await nearAPI.connect({
    keyStore: keyStore,
    networkId: config.networkId,
    nodeUrl: config.nodeUrl,
  });
}

async function getAccFromFile(file) {
  const keyFile = require(file);
  let key = keyFile.secret_key || keyFile.private_key
  let name = keyFile.account_id
  return await getExistentAcc(name, getKeyPair(key))
}
function getKeyPair(privKey) {
  return nearAPI.utils.KeyPair.fromString(privKey)
}

async function getExistentAcc(name, keyPair) {
  if (!keyPair) {
    keyPair = getKeyPairOfAcc(name)
  }
  await keyStore.setKey(config.networkId, name, keyPair)
  return await near.account(name)
}
async function createAccount(masterAccount, name) {
  let accountName
  if (name) {
    accountName = getSubAccName(name, masterAccount)
  } else {
    accountName = getSubAccName(makeid(63 - masterAccount.accountId.length), masterAccount)
  }

  let keypair
  try{
    let keyFile = require(config.existentAcc.master.keyPath);
    let key = keyFile.secret_key || keyFile.private_key
    keypair = getKeyPair(key)
    await keyStore.setKey(config.networkId, accountName, keypair)
    await masterAccount.createAccount(
      accountName,
      keypair.getPublicKey(),
      new BN(10).pow(new BN(27))
    );
  }catch (e){
    console.log("Error creating account, please fix it or re run the test")
    console.log(e)
    process.exit(1)
  }
  let account = getExistentAcc(accountName, keypair)
  return account
}


async function getKeyPairOfAcc(accountId) {
  return await keyStore.getKey(config.networkId, accountId)
}

function loadContract(userAccount, contractAccount, contract) {

  const instance = new Contract(
    userAccount, // the account object that is connecting
    contractAccount,
    contract
  );
  userAccount[contractAccount] = instance
  console.log("Added " + contract.name + " to " + userAccount.accountId);

}

async function deployContract(contractAccount, contract) {
  await contractAccount.deployContract(fs.readFileSync(path.join(__dirname, "..", "res", contract.file)))
  console.log("Contract deployed: " + contract.name)
}

var accountNames = []
function makeid(length) {
  var result           = '';
  var characters       = 'abcdefghijklmnopqrstuvwxyz';
  var charactersLength = characters.length;
  for ( var i = 0; i < length; i++ ) {
    result += characters.charAt(Math.floor(Math.random() * 
charactersLength));
 }
 if (accountNames.includes(result)){
  makeid(length)
 }
 accountNames.push(result)
 return result;
}
async function deleteAccounts(accounts, beneficiary){
  for (let i = 0; i < accounts.length; i++){
    try{
      accounts[i].deleteAccount(beneficiary.accountId)
    }catch(e){
      console.log("Error deleting " + accounts[i].accountId)
    }
  }
}


///Write the test here
(async function main() {
  async function evalFromTerminal() {

    console.log("Interactive mode:")
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    let interactive = true
    while (interactive) {
      await new Promise(resolve => {
        rl.question("_>", (command) => {
          if (command === "return") {
            rl.close()
            interactive = false
            return resolve()
          }
          eval(command)
          resolve()
        })
      })
    }
  }
  if (process.argv.length >= 2 && process.argv[2] === "-i") {
    await evalFromTerminal()
  }

  //Start
  await initNear()
  // never change this line
  let masterAcc = await getAccFromFile(config.existentAcc.master.keyPath)

  let userAcc1 = await createAccount(masterAcc)
  let userAcc2 = await createAccount(masterAcc)

  let wnearAcc = await createAccount(masterAcc)
  let stNearAcc = await createAccount(masterAcc)

  console.log("Finished creating account/s");



  console.log("Finished deploying contract/s");
  
  loadContract(masterAcc, wnearAcc.accountId, contracts.ft)
  loadContract(masterAcc, stNearAcc.accountId, contracts.ft)

  function initContracts(){

    await deployContract(wnearAcc, contracts.ft)
    await deployContract(stNearAcc, contracts.ft)

    console.log("Init stnear")
    await masterAcc[stNearAcc.accountId]["new"](
      {
        owner_id: masterAcc.accountId,
        total_supply: "1000000000000000000000000000000",
        version: "1.0.0",
        name: "stNEAR test token",
        symbol: "STNEARTEST",
        reference: "",
        reference_hash: "",
        decimals: 24
      }
    )

    console.log("Init wNear")
    await masterAcc[wnearAcc.accountId]["new"](
      {
        owner_id: masterAcc.accountId,
        total_supply: "1000000000000000000000000000000",
        version: "1.0.0",
        name: "wNEAR test token",
        symbol: "WNEARTEST",
        reference: "",
        reference_hash: "",
        decimals: 24
      }
    )
  }
  function mintTokens(){
    console.log("mint stnear")
    let minBal = await masterAcc[stNearAcc.accountId]["storage_minimum_balance"]()
    await masterAcc[stNearAcc.accountId]["storage_deposit"](
      {
        account_id: userAcc1.accountId
      },
      undefined,
      new BN(minBal)
    )
    await masterAcc[stNearAcc.accountId]["mint"](
      {
        amount: "10000000000000000000000000000"
      }
    )
    await masterAcc[stNearAcc.accountId]["ft_transfer"](
      {
        receiver_id: userAcc1.accountId,
        amount: "100000000000000000000000000"
      }
    )

    console.log("mint wNear")
    let minBal = await masterAcc[wnearAcc.accountId]["storage_minimum_balance"]()
    await masterAcc[wnearAcc.accountId]["storage_deposit"](
      {
        account_id: userAcc2.accountId
      },
      undefined,
      new BN(minBal)
    )
    await masterAcc[wnearAcc.accountId]["mint"](
      {
        amount: "10000000000000000000000000000"
      }
    )
    await masterAcc[wnearAcc.accountId]["ft_transfer"](
      {
        receiver_id: userAcc2.accountId,
        amount: "100000000000000000000000000"
      }
    )
  }

  //Begin
  try {
    console.log("Begin");

    initContracts()

    mintTokens()

  } catch (e) {
    console.log("Error:\n" + e)
  }
  console.log("Done");
})()


