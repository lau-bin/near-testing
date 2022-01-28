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
  console.error("Bad network env") | process.exit(1)
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
  nft: {
    name: "nft-simple",
    viewMethods: [
      "get_contract_royalty",
      "get_supply_caps",
      "get_token_types_locked",
      "is_token_locked",
      "nft_is_approved"
    ],
    changeMethods: [
      "new",
      "set_contract_royalty",
      "add_token_types",
      "unlock_token_types",
      "nft_mint",
      "nft_transfer",
      "nft_transfer_payout",
      "nft_transfer_call",
      "nft_approve",
      "nft_revoke",
      "nft_revoke_all",
      "nft_total_supply",
      "nft_token",
      "nft_tokens",
      "nft_tokens_batch",
      "nft_supply_for_type",
      "nft_tokens_for_type",
      "nft_supply_for_owner",
      "nft_tokens_for_owner"
    ],
    file: "nft_simple.wasm"
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
  try {
    let keyFile = require(config.existentAcc.master.keyPath);
    let key = keyFile.secret_key || keyFile.private_key
    keypair = getKeyPair(key)
    await keyStore.setKey(config.networkId, accountName, keypair)
    await masterAccount.createAccount(
      accountName,
      keypair.getPublicKey(),
      new BN(10).pow(new BN(27))
    );
  } catch (e) {
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
  var result = '';
  var characters = 'abcdefghijklmnopqrstuvwxyz';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }
  if (accountNames.includes(result)) {
    makeid(length)
  }
  accountNames.push(result)
  return result;
}
async function deleteAccounts(accounts, beneficiary) {
  for (let i = 0; i < accounts.length; i++) {
    try {
      accounts[i].deleteAccount(beneficiary.accountId)
    } catch (e) {
      console.log("Error deleting " + accounts[i].accountId)
    }
  }
}
function paddDate(date) {
  if (date.length == 1) date = "0" + date
  return date
}
const currentDate = new Date()
let month = paddDate(String((currentDate.getMonth() + 1)))
let day = paddDate(currentDate.getDate().toString())
let hour = paddDate(currentDate.getHours())
let minute = paddDate(currentDate.getMinutes())
let second = paddDate(currentDate.getSeconds())
let parsedDate = `${currentDate.getFullYear()}-${month}-${day}T${hour}:${minute}:${second}`
const nftBase = {
  metadata: {
    title: undefined,
    description: undefined,
    media: undefined,
    media_hash: undefined,
    copies: "0",
    issued_at: parsedDate,
    starts_at: parsedDate,
    reference: undefined,
    reference_hash: undefined
  },
  perpetual_royalties: undefined,
  token_type: undefined
}
const tokenTypes = {
  token1: "token1",
  token2: "token2",
  token3: "token3",
  token4: "token4",
  token5: "token5"
}

const nftContractData = {
  owner_id: undefined,
  metadata: {
    spec: "1.0.0",
    name: "nft-simple",
    symbol: "NFTS"
  },
  supply_cap_by_type: {
    [tokenTypes.token1]: "1",
    [tokenTypes.token2]: "10",
    [tokenTypes.token3]: "100",
    [tokenTypes.token4]: "1000",
    [tokenTypes.token5]: "10000"
  },
  locked: true
}

const nftN1 = Object.assign({}, nftBase)
nftN1.metadata.title = "Token Nº1"
nftN1.metadata.description = "Some desc"
nftN1.metadata.media = "https://cookiefactory.co/output/582.png"
nftN1.metadata.media_hash = "709cf450782012061eb34f6c547021ce096fe478761e6e5ece9e1acb1c538413"
nftN1.metadata.reference = "ref url"
nftN1.metadata.reference_hash = "709cf450782012061eb34f6c547021ce096fe478761e6e5ece9e1acb1c538413"
nftN1.perpetual_royalties = new Map([["acc1", 2]])
// nftN1.token_type = tokenTypes.token1

function makeNFT(nft) {
  try {
    let nftHistory = JSON.parse(fs.readFileSync(path.join("res","nftHistory.json")))
    let lastCopy = nftHistory[nft.token_type]
    if (lastCopy != undefined) {
      nft.metadata.copies = String(lastCopy + 1)
      nftHistory[nft.token_type]++
    }
    else{
      nftHistory[nft.token_type] = 0
    }
    console.log("Copy Nº: " + nft.metadata.copies)
    fs.writeFileSync(path.join("res","nftHistory.json"), JSON.stringify(nftHistory))
    return nft
  } catch (e) {
    console.error(e)
    process.exit(1)
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
        rl.question("_>", async (command) => {
          if (command === "return") {
            rl.close()
            interactive = false
            return resolve()
          }
          try{
            await eval(command)
          }catch(e){
            console.error("Error: ")
            console.error(e)
          }
          resolve()
        })
      })
    }
  }


  //Start
  await initNear()
  // never change this line
  let test = true
  let contractAcc
  let owner
  if (test){
    masterAcc = await getAccFromFile(config.existentAcc.master.keyPath)
    owner = await createAccount(masterAcc)
    contractAcc = await createAccount(masterAcc)
  }
  else{
    contractAcc = await getAccFromFile(config.existentAcc.master.keyPath)
    owner = await getAccFromFile(config.existentAcc.master.keyPath)
  }

  console.log("Finished creating account/s");

  loadContract(owner, contractAcc.accountId, contracts.nft)

  let nftOwner = owner[contractAcc.accountId]

  async function deploy(){
    await deployContract(contractAcc, contracts.nft)
    console.log("Finished deploying contract/s");
  
    // instantiate contract
    console.log("instantiate contract")
    nftContractData.owner_id = owner.accountId
    await nftOwner["new"](
      nftContractData
    )
  }

  async function mintNFT(nft) {
    console.log("Minting: " + nft.metadata.title)
    await nftOwner["nft_mint"](
      {
        metadata: nft.metadata,
        perpetual_royalties: Object.fromEntries(nft.perpetual_royalties),
        token_type: nft.token_type
      },
      undefined,
      new BN(nearAPI.utils.format.parseNearAmount("1"))
    )
  }
  // set option to start console instead of script
  if (process.argv.length >= 2 && process.argv[2] === "-i") {
    await evalFromTerminal()
    return
  }
  //Begin
  try {

    console.log("Begin");

    // deploy contract
    console.log("Deploying contract")
    await deploy()

    // mint 30 nft1
    // console.log("Minting")
    // for (let i of util.times(1)){
    //   console.log("Nº " + i)
    //   await mintNFT(makeNFT(nftN1))
    // }


  } catch (e) {
    console.log("Error:\n" + e)
  }
  console.log("Done");

  if (process.argv.length >= 2 && process.argv[2] === "-il") {
    await evalFromTerminal()
    return
  }
})()


