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
  }
})()

function getSubAccName(name, parentAcc) {
  return name + "." + parentAcc.accountId
}
const contracts = {
  greeting: {
    name: "greeting",
    viewMethods: [
      "getGreeting",
      "getMsgview"
    ],
    changeMethods: [
      "getMsg",
      "getMsgEsp"
    ],
    file: "greeting_contract.wasm"
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
  userAccount[contractAccount.accountId] = instance
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
  let contractGreeting = contracts.greeting
  let masterAcc = await getAccFromFile(config.existentAcc.master.keyPath)
  let gretContractAcc = await createAccount(masterAcc, contractGreeting.name)

  let user1Acc = await createAccount(masterAcc, "user1")

  console.log("Finished creating account/s");

  await deployContract(gretContractAcc, contractGreeting)

  console.log("Finished deploying contract/s");

  loadContract(user1Acc, gretContractAcc, contractGreeting)

  //Begin test
  try {
    console.log("Begin test");
    let gretCtrUser = user1Acc[gretContractAcc.accountId]
    let greyView = contracts.greeting.viewMethods
    let gretCall = contracts.greeting.changeMethods

    console.log("getGreeting");
    let greet = await gretCtrUser["getGreeting"]()
    console.log(greet);

    
    console.log("getMsg");

    let cant = 10000
    let greet3 = await gretCtrUser["getMsg"](
      {
        amount: cant
      },
      new BN("300000000000000")
    )
    console.log(greet3)
    console.log("getGreeting");
    let greet2 = await gretCtrUser["getGreeting"]()
    console.log(greet2);
    // let cant = 57022
    // let greet3 = await gretCtrUser["getMsgview"](
    //   {
    //     amount: cant
    //   }
    // )
    // console.log(greet3)

    
    // let error = true
    // let amou = 1000000
    // let addition = amou
    // while(error){
    //   console.log("Current try: " + amou);
    //   console.log("Current add: " + addition);
    //   try{
    //     let greet2 = await gretCtrUser["getMsg"](
    //       {
    //         amount: amou
    //       },
    //       new BN("300000000000000")

    //     )
    //   }catch(e){
    //     if (addition <= 1){
    //       break
    //     }
    //     addition = Math.floor(addition / 2)
    //     amou -= addition
    //     // console.log(e)
    //     continue
    //   }
    //   if (addition <= 1){
    //     break
    //   }
    //   addition = Math.floor(addition / 2)
    //   amou += addition
    // }
    // console.log("Amount is: ");
    // console.log(amou);


  } catch (e) {
    console.log("Error in test:\n" + e)
  }


  gretContractAcc.deleteAccount(masterAcc.accountId)
  user1Acc.deleteAccount(masterAcc.accountId)
  console.log("Done");
})()


