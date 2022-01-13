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
const NETWORK = networkOptions.local
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
  metapool: {
    name: "meta-pool",
    viewMethods: [
      "ft_balance_of"
    ],
    changeMethods: [
      "new",
      "ft_transfer_call",
      "deposit_and_stake"//min 10 near
    ],
    file: "metapool.wasm"
  },
  test: {
    name: "test-contract",
    viewMethods: [
    ],
    changeMethods: [
      "new"
    ],
    file: "test_contract.wasm"
  },
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
    new BN(10).pow(new BN(27))
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
  let masterAcc = await getAccFromFile(config.existentAcc.master.keyPath)

  let user1Acc = await createAccount(masterAcc, "user1")
  let ownerAcc = await createAccount(masterAcc, "owner")
  let treasuryAcc = await createAccount(masterAcc, "treasury")
  let operatorAcc = await createAccount(masterAcc, "operator")
  let metapoolAcc = await createAccount(masterAcc, contracts.metapool.name)
  let testAcc = await createAccount(masterAcc, contracts.test.name)
  let testAcc2 = await createAccount(masterAcc, contracts.test.name + "_2")
  let testAcc3 = await createAccount(masterAcc, contracts.test.name + "_3")

  console.log("Finished creating account/s");

  await deployContract(metapoolAcc, contracts.metapool)
  await deployContract(testAcc, contracts.test)
  await deployContract(testAcc2, contracts.test)
  await deployContract(testAcc3, contracts.test)

  console.log("Finished deploying contract/s");
  
  loadContract(user1Acc, metapoolAcc.accountId, contracts.metapool)
  loadContract(testAcc2, metapoolAcc.accountId, contracts.metapool)
  loadContract(testAcc, testAcc.accountId, contracts.test)
  loadContract(testAcc2, testAcc2.accountId, contracts.test)
  loadContract(testAcc3, testAcc3.accountId, contracts.test)
  loadContract(ownerAcc, metapoolAcc.accountId, contracts.metapool)

  //Begin test
  try {
    console.log("Begin test: multiple transfers while initial waits and fails");

    let metaPoolCtrOwner = ownerAcc[metapoolAcc.accountId]
    let metaPoolCtrUser = user1Acc[metapoolAcc.accountId]
    let metaPoolCtrTest2Ctr = testAcc2[metapoolAcc.accountId]
    let testCtr = testAcc[testAcc.accountId]
    let test2Ctr = testAcc2[testAcc2.accountId]
    let test3Ctr = testAcc3[testAcc3.accountId]


    // instantiate metapool
    console.log("instantiate metapool")
    await metaPoolCtrOwner["new"](
      {
        owner_account_id: ownerAcc.accountId,
        treasury_account_id: treasuryAcc.accountId,
        operator_account_id: operatorAcc.accountId,
        meta_token_account_id: ownerAcc.accountId //dummy account, unused in this test
      }
    )
    
    // instantiate test contract
    console.log("instantiate test contract")
    await testCtr["new"](
      {
        account_id: testAcc2.accountId
      }
    )

    // instantiate test contract 2
    console.log("instantiate test contract 2")
    await test2Ctr["new"](
      {
        account_id: testAcc2.accountId //unused in test
      }
    )

    // instantiate test contract 3
    console.log("instantiate test contract 3")
    await test3Ctr["new"](
      {
        account_id: testAcc3.accountId //unused in test
      }
    )

    // deposit 100 near in metapool for user1
    console.log("deposit 100 near in metapool for user1")
    await metaPoolCtrUser["deposit_and_stake"](
      {

      },
      undefined,
      new BN(nearAPI.utils.format.parseNearAmount("100"))
    )

    // check user1 balance
    console.log("check user1 balance")
    let user1Balance_1 = await metaPoolCtrUser["ft_balance_of"](
      {
        account_id: user1Acc.accountId
      }
    )

    // check testAcc balance
    console.log("check testAcc balance")
    let testAccBalance_1 = await metaPoolCtrUser["ft_balance_of"](
      {
        account_id: testAcc.accountId
      }
    )

    // check testAcc2 balance
    console.log("check testAcc2 balance")
    let testAcc2Balance_1 = await metaPoolCtrUser["ft_balance_of"](
      {
        account_id: testAcc2.accountId
      }
    )

    // check testAcc3 balance
    console.log("check testAcc3 balance")
    let testAcc3Balance_1 = await metaPoolCtrUser["ft_balance_of"](
      {
        account_id: testAcc3.accountId
      }
    )

    // transfer 50 near to testAcc, mode transfer_and_wait_out_of_gas
    // testAcc will re transfer to testAcc2 and wait until out of gas
    console.log("transfer 50 near to testAcc, mode transfer_and_wait_out_of_gas")
    console.log("testAcc will re transfer to testAcc2 and wait until out of gas")
    let transferPromise = metaPoolCtrUser["ft_transfer_call"](
      {
        receiver_id: testAcc.accountId,
        amount: nearAPI.utils.format.parseNearAmount("50"),
        memo: undefined,
        msg: "transfer_and_wait_out_of_gas"
      },
      undefined,
      new BN(1)
    )

    try{
      // transfer 50 near to testAcc3 from testAcc2, mode no_error
      console.log("transfer 50 near to testAcc from testAcc2, mode no_error")
      await metaPoolCtrTest2Ctr["ft_transfer_call"](
        {
          receiver_id: testAcc3.accountId,
          amount: nearAPI.utils.format.parseNearAmount("50"),
          memo: undefined,
          msg: "no_error"
        },
        undefined,
        new BN(1)
      )
    }catch(e){
      console.log("Expected error")
      console.log(e)
    }

    // wait for all transfers to end
    await transferPromise

    // check user1 balance
    console.log("check user1 balance")
    let user1Balance_2 = await metaPoolCtrUser["ft_balance_of"](
      {
        account_id: user1Acc.accountId
      }
    )

    // check testAcc balance
    console.log("check testAcc balance")
    let testAccBalance_2 = await metaPoolCtrUser["ft_balance_of"](
      {
        account_id: testAcc.accountId
      }
    )

    // check testAcc2 balance
    console.log("check testAcc2 balance")
    let testAcc2Balance_2 = await metaPoolCtrUser["ft_balance_of"](
      {
        account_id: testAcc2.accountId
      }
    )

    // check testAcc3 balance
    console.log("check testAcc3 balance")
    let testAcc3Balance_2 = await metaPoolCtrUser["ft_balance_of"](
      {
        account_id: testAcc3.accountId
      }
    )

    console.log("User1 balance before transfer:")
    console.log(user1Balance_1)
    console.log("User1 balance after transfer:")
    console.log(user1Balance_2)

    console.log("testAcc balance before transfer:")
    console.log(testAccBalance_1)
    console.log("testAcc balance after transfer:")
    console.log(testAccBalance_2)

    console.log("testAcc2 balance before transfer:")
    console.log(testAcc2Balance_1)
    console.log("testAcc2 balance after transfer:")
    console.log(testAcc2Balance_2)

    console.log("testAcc3 balance before transfer:")
    console.log(testAcc3Balance_1)
    console.log("testAcc3 balance after transfer:")
    console.log(testAcc3Balance_2)

    assert(user1Balance_1 === nearAPI.utils.format.parseNearAmount("100"), "user1 should start at 100 near")
    assert(user1Balance_2 === nearAPI.utils.format.parseNearAmount("100"), "user1 balance should have been refunded")
    assert(testAccBalance_1 === "0", "testAcc1 should start at 0 near")
    assert(testAccBalance_2 === "0", "after first transfer fails testAcc1 balance should have been reverted")
    assert(testAcc2Balance_1 === "0", "testAcc2 should start at 0 near")
    assert(testAcc2Balance_2 === "0", "testAcc2 should never had received any token")
    assert(testAcc3Balance_1 === "0", "testAcc3 should start at 0 near")
    assert(testAcc3Balance_2 === "0", "testAcc3 should never had received any token")

    console.log("Test passed");
  } catch (e) {
    console.log("Error in test:\n" + e)
  }
  console.log("Done");
})()


