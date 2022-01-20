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
const NETWORK = networkOptions.testnet
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
            keyPath: "/home/god/.near-credentials/testnet/hardcoder.testnet.json"
          }
        }
      }
  }
})()

function getSubAccName(name, parentAcc) {
  return name + "." + parentAcc.accountId
}
const contracts = {
  testToken: {
    name: "test-token",
    viewMethods: [
      "get_owner_id",
      "get_locked_amount",
      "get_owner",
      "get_vesting_info",
      "storage_balance_bounds",
      "storage_balance_of"
    ],
    changeMethods: [
      "new",
      "ft_mint",
      "self_burn",
      "add_minter",
      "remove_minter",
      "set_metadata_icon",
      "set_metadata_reference",
      "set_owner",
      "mint_vested",
      "cancel_vesting",
      "ft_transfer",
      "ft_transfer_call",
      "ft_total_supply",
      "ft_balance_of",
      "ft_resolve_transfer",
      "ft_metadata",
      "storage_deposit",
      "storage_withdraw",
      "storage_unregister"



    ],
    file: "test_token_nep145.wasm"
  },
  pool: {
    name: "cookie-factory-pool",
    viewMethods: [
      "get_contract_params",
      "status",
      "storage_balance_bounds",
      "storage_balance_of"
    ],
    changeMethods: [
      "new",
      "unstake",
      "close",
      "set_active",
      "set_closing_date",
      "storage_deposit",
      "storage_unregister",
      "get_registered_accounts"

    ],
    file: "cookie_factory_st_pool.wasm"
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
  if (name.lenght >= 32) {
    accountName = name
  } else {
    accountName = getSubAccName(name, masterAccount)
  }
  let keyPair = await getKeyPairOfAcc(masterAccount.accountId)
  await masterAccount.createAccount(
    accountName,
    keyPair.getPublicKey(),
    new BN(10).pow(new BN(25))
  );
  return getExistentAcc(accountName, keyPair)
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
  let contractPoolMeta = contracts.pool
  contractPoolMeta.name = "cookie-factory-pool-meta3"
  let contractPoolStNear = Object.assign({}, contracts.pool)
  contractPoolStNear.name = "cookie-factory-pool-stnear3"
  let contractPoolCheddar = Object.assign({}, contracts.pool)
  contractPoolCheddar.name = "cookie-factory-pool-cheddar3"


  let contractTestToken = contracts.testToken
  let masterAcc = await getAccFromFile(config.existentAcc.master.keyPath)
  // let poolContractAcc = await getAccFromFile("/home/god/.near-credentials/testnet/cookie-factory-pool.hardcoder.testnet.json")
  // let testTokenContractAcc = await getAccFromFile("/home/god/.near-credentials/testnet/test-token.hardcoder.testnet.json")


  let user1Acc = await getAccFromFile("/home/god/.near-credentials/default/cookie-user1.testnet.json")
  let ownerAcc = await getAccFromFile("/home/god/.near-credentials/default/cookiefactory.testnet.json")
  let treasuryAcc = await getAccFromFile("/home/god/.near-credentials/default/cookiefactory-treasury.testnet.json")

  let poolMetaAcc = await createAccount(masterAcc, contractPoolMeta.name)
  let poolStNearAcc = await createAccount(masterAcc, contractPoolStNear.name)
  let poolCheddarAcc = await createAccount(masterAcc, contractPoolCheddar.name)
  // let poolMetaAcc = await getAccFromFile("/home/god/.near-credentials/testnet/cookie-factory-pool-meta.hardcoder.testnet.json")
  // let poolStNearAcc = await getAccFromFile("/home/god/.near-credentials/testnet/cookie-factory-pool-stnear.hardcoder.testnet.json")
  // let poolCheddarAcc = await getAccFromFile("/home/god/.near-credentials/testnet/cookie-factory-pool-cheddar.hardcoder.testnet.json")

  // let poolContractAcc = await createAccount(masterAcc, "cookie-factory-pool")
  // let testTokenContractAcc = await createAccount(masterAcc, "test-token")

  // let user1Acc = await createAccount(masterAcc, "user1")
  // let ownerAcc = await createAccount(masterAcc, "owner")
  // let treasuryAcc = await createAccount(masterAcc, "trasury1")

  console.log("Finished creating account/s");

  await deployContract(poolMetaAcc, contractPoolMeta)
  await deployContract(poolStNearAcc, contractPoolStNear)
  await deployContract(poolCheddarAcc, contractPoolCheddar)

  // await deployContract(testTokenContractAcc, contractTestToken)

  console.log("Finished deploying contract/s");
  
  loadContract(ownerAcc, poolMetaAcc.accountId, contractPoolMeta)
  loadContract(ownerAcc, poolStNearAcc.accountId, contractPoolStNear)
  loadContract(ownerAcc, poolCheddarAcc.accountId, contractPoolCheddar)

  loadContract(user1Acc, "meta-v2.pool.testnet", contractTestToken)
  loadContract(user1Acc, "token.cheddar.testnet", contractTestToken)
  loadContract(user1Acc, "token.meta.pool.testnet", contractTestToken)


  //Begin test
  try {
    console.log("Begin test");
    // let poolCtrUser = user1Acc[poolContractAcc.accountId]
    // let poolStNearCtrOwner = ownerAcc[poolContractAcc.accountId]
    // let poolView = contracts.pool.viewMethods
    // let poolCall = contracts.pool.changeMethods

    // let testTokenCtrUser = user1Acc[testTokenContractAcc.accountId]
    // let testTokenCtrOwner = ownerAcc[testTokenContractAcc.accountId]
    // let testTokenView = contracts.testToken.viewMethods
    // let testTokenCall = contracts.testToken.changeMethods

    let cheddarOwner = ownerAcc[poolCheddarAcc.accountId]
    let metaOwner = ownerAcc[poolMetaAcc.accountId]
    let stNearOwner = ownerAcc[poolStNearAcc.accountId]

    let cheddarTUser = user1Acc["token.cheddar.testnet"]
    let metaTUser = user1Acc["token.meta.pool.testnet"]
    let stNearTUser = user1Acc["meta-v2.pool.testnet"]


    //Instantiate Test token contract
    // console.log("Instantiate Test token contract");
    // await testTokenCtrOwner["new"](
    //   {
    //     owner_id: ownerAcc.accountId
    //   }
    // )
    // assert(await testTokenCtrOwner["get_owner_id"]() === ownerAcc.accountId, util.err("test token new"))
    //Instantiate pools
    console.log("Instantiate pool contract");
    let closeDate = 1641816000000;
    let poolCtrNewParams = {
      owner_id: ownerAcc.accountId,
      staked_token: "",
      treasury: treasuryAcc.accountId,
      returnable: false,
      closing_date: closeDate
    }
    console.log("Instantiating cheddar");
    poolCtrNewParams.staked_token = "token.cheddar.testnet"
    await cheddarOwner["new"](
      poolCtrNewParams
    )
    console.log(await cheddarOwner["get_contract_params"]())
    console.log("Instantiating meta");
    poolCtrNewParams.staked_token = "token.meta.pool.testnet"
    await metaOwner["new"](
      poolCtrNewParams
    )
    console.log(await metaOwner["get_contract_params"]())
    console.log("Instantiating stNear");
    poolCtrNewParams.staked_token = "meta-v2.pool.testnet"
    await stNearOwner["new"](
      poolCtrNewParams
    )
    console.log(await stNearOwner["get_contract_params"]())


    //Register user and pool account in tokens
    let storageCost = 0
    console.log("Register accounts in tokens");
    storageCost = await cheddarTUser["storage_balance_bounds"]()
    console.log("Registering user in cheddar");
    await cheddarTUser["storage_deposit"](
      {
        account_id: user1Acc.accountId
      },
      undefined,
      new BN(storageCost.min)
    )
    console.log("Registering pool in cheddar");
    await cheddarTUser["storage_deposit"](
      {
        account_id: poolCheddarAcc.accountId
      },
      undefined,
      new BN(storageCost.min)
    )
    storageCost = await metaTUser["storage_balance_bounds"]()
    console.log("Registering user in meta");
    await metaTUser["storage_deposit"](
      {
        account_id: user1Acc.accountId
      },
      undefined,
      new BN(storageCost.min)
    )
    console.log("Registering pool in meta");
    await metaTUser["storage_deposit"](
      {
        account_id: poolMetaAcc.accountId
      },
      undefined,
      new BN(storageCost.min)
    )
    storageCost = await stNearTUser["storage_balance_bounds"]()
    console.log("Registering user in stNear");
    await stNearTUser["storage_deposit"](
      {
        account_id: user1Acc.accountId
      },
      undefined,
      new BN(storageCost.min)
    )
    console.log("Registering pool in stNear");
    await stNearTUser["storage_deposit"](
      {
        account_id: poolStNearAcc.accountId
      },
      undefined,
      new BN(storageCost.min)
    )


    //Register pool account in tokens
    // console.log("Register pool account in test token");
    // await testTokenCtrUser["storage_deposit"](
    //   {
    //     account_id: poolContractAcc.accountId
    //   },
    //   undefined,
    //   new BN(storageCost.min)
    // )
    //Mint 100 tokens to the user
    // await testTokenCtrOwner["ft_mint"](
    //   {
    //     receiver_id: user1Acc.accountId,
    //     amount: "100"
    //   },
    //   undefined,
    //   new BN(1)
    // )
    //Register user account in pool
    // console.log("Register user account in pool");
    // let storageCostPool = await poolCtrUser["storage_balance_bounds"]()
    // await poolCtrUser["storage_deposit"](
    //   {
    //     account_id: user1Acc.accountId,
    //     registration_only: true
    //   },
    //   undefined,
    //   new BN(storageCostPool.min)
    // )
    //Transfer test tokens to pool
    // console.log("Transfer test tokens to pool");
    // await testTokenCtrUser["ft_transfer_call"](
    //   {
    //     receiver_id: poolContractAcc.accountId,
    //     amount: "10",
    //     memo: null,
    //     msg: "Transfering 10 test tokens to pool"
    //   },
    //   undefined,
    //   new BN(1)
    // )

    //Get registered accounts
    // console.log("Get registered accounts");
    // let regAccs = await poolCtrOwner["get_registered_accounts"](
    //   {
    //     from_index: 0,
    //     limit: 50
    //   }
    // )
    // console.log(regAccs)
    // await evalFromTerminal()
  } catch (e) {
    console.log("Error in test:\n" + e)
  }
  console.log("Test end")
  //Node cleanup
  // poolContractAcc.deleteAccount(masterAcc.accountId)
  // testTokenContractAcc.deleteAccount(masterAcc.accountId)
  // user1Acc.deleteAccount(masterAcc.accountId)
  // ownerAcc.deleteAccount(masterAcc.accountId)
  // treasuryAcc.deleteAccount(masterAcc.accountId)
  console.log("Done");
})()


