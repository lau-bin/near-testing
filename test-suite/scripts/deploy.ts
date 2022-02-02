import { Account } from "near-api-js"
import { Contract } from "util/contract"
import { createSubAccount, getAccFromFile } from "util/near"
import { NearConncetion } from "util/near-connection"
import {evalFromTerminal} from "../util/interactiveConsole"
import {contracts} from "./contractSpec"
import {getConfig} from "../config"
import {assert, hasValue} from "utilities"
evalFromTerminal(this)

let config = getConfig()
let connection = await NearConncetion.build(config)

let masterAcc = await getAccFromFile(config.existentAcc.master.keyPath, connection)
let owner = process.env.OWNER_ACC
if (!owner){
  owner = await createSubAccount(masterAcc, connection, "owner", {
    
  })
}

async function deployPools(ownerAcc:string, masterAcc:Account) {
  let contractPoolMeta = new Contract(createSubAccount(masterAcc, ))
  contractPoolMeta.name = "meta"
  let contractPoolStNear = Object.assign({}, contracts.pool)
  contractPoolStNear.name = "stnear"
  let contractPoolCheddar = Object.assign({}, contracts.pool)
  contractPoolCheddar.name = "cheddar"
  let tokens = {
    cheddar: "token.cheddar.testnet",
    stNear: "meta-v2.pool.testnet",
    meta: "token.meta.pool.testnet"
  }

  let contractTestToken = contracts.testToken
  let treasuryAcc = await createAccount(masterAcc, "treasury", 10, 1)
  let poolMetaAcc = await createAccount(masterAcc, contractPoolMeta.name, 10, 1)
  let poolStNearAcc = await createAccount(masterAcc, contractPoolStNear.name, 10, 1)
  let poolCheddarAcc = await createAccount(masterAcc, contractPoolCheddar.name, 10, 1)

  console.log("Finished creating account/s");

  await deployContract(poolMetaAcc, contractPoolMeta)
  await deployContract(poolStNearAcc, contractPoolStNear)
  await deployContract(poolCheddarAcc, contractPoolCheddar)

  // await deployContract(testTokenContractAcc, contractTestToken)

  console.log("Finished deploying contract/s");

  loadContract(poolMetaAcc, poolMetaAcc.accountId, contractPoolMeta)
  loadContract(poolStNearAcc, poolStNearAcc.accountId, contractPoolStNear)
  loadContract(poolCheddarAcc, poolCheddarAcc.accountId, contractPoolCheddar)

  loadContract(poolCheddarAcc, tokens.cheddar, contractTestToken)
  loadContract(poolMetaAcc, tokens.meta, contractTestToken)
  loadContract(poolStNearAcc, tokens.stNear, contractTestToken)
  // await loadContract(testTokenContractAcc, testTokenContractAcc.accountId, contractTestToken)

  //Instantiate Test token contract
  // console.log("Instantiate Test token contract");
  // await testTokenContractAcc[]["new"](
  //   {
  //     owner_id: ownerAcc.accountId
  //   }
  // )
  // assert(await testTokenContractAcc["get_owner_id"]() === ownerAcc.accountId, util.err("test token new"))
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
  poolCtrNewParams.staked_token = tokens.cheddar
  await poolCheddarAcc[poolCheddarAcc.accountId]["new"](
    poolCtrNewParams
  )
  console.log(await poolCheddarAcc[poolCheddarAcc.accountId]["get_contract_params"]())
  console.log("Instantiating meta");
  poolCtrNewParams.staked_token = tokens.meta
  await poolMetaAcc["new"](
    poolCtrNewParams
  )
  console.log(await poolMetaAcc[poolMetaAcc.accountId]["get_contract_params"]())
  console.log("Instantiating stNear");
  poolCtrNewParams.staked_token = tokens.stNear
  await poolStNearAcc["new"](
    poolCtrNewParams
  )
  console.log(await poolStNearAcc[poolMetaAcc.accountId]["get_contract_params"]())


  //Register user and pool account in tokens
  let storageCost
  console.log("Register accounts in tokens");
  storageCost = await poolCheddarAcc[poolCheddarAcc.accountId]["storage_balance_bounds"]()
  console.log("Registering pool in cheddar");
  await poolCheddarAcc[poolCheddarAcc.accountId]["storage_deposit"](
    {
      account_id: poolCheddarAcc.accountId
    },
    undefined,
    new BN(storageCost.min)
  )
  storageCost = await poolMetaAcc[poolMetaAcc.accountId]["storage_balance_bounds"]()
  console.log("Registering pool in meta");
  await poolMetaAcc[poolMetaAcc.accountId]["storage_deposit"](
    {
      account_id: poolMetaAcc.accountId
    },
    undefined,
    new BN(storageCost.min)
  )
  storageCost = await poolStNearAcc[poolStNearAcc.accountId]["storage_balance_bounds"]()
  console.log("Registering pool in stNear");
  await poolStNearAcc[poolStNearAcc.accountId]["storage_deposit"](
    {
      account_id: poolStNearAcc.accountId
    },
    undefined,
    new BN(storageCost.min)
  )
}
async function deployMarket(ownerAcc) {
  // masterAcc must be NFTToken account
  // let masterAccPath = process.env.TOKEN_ACC_PATH
  // let masterAcc = await getAccFromFile(masterAccPath)
  let contractAcc = await getAccFromFile("/home/god/.near-credentials/testnet/nft-simple-cwkbq.cookiefactory.testnet")
  console.log("Finished creating account/s");

  await deployContract(contractAcc, contracts.market)
  loadContract(contractAcc, contractAcc.accountId, contracts.market)
  console.log("Finished deploying contract/s");

  // instantiate contract
  console.log("instantiate market contract")
  await contractAcc[contractAcc.accountId]["new"](
    {
      owner_id: ownerAcc,
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
  )
}