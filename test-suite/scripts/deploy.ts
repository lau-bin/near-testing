import { Account } from "near-api-js"
import { Contract } from "../lib/contract"
import { createSubAccount, deployContract, getAccFromFile, getExistentAcc, getKey } from "../lib/near"
import { NearConncetion } from "../lib/near-connection"
import { evalFromTerminal } from "../lib/interactiveConsole"
import { contracts } from "./contractSpec"
import { getConfig } from "../lib/config.js"
import { assert, hasValue, isString } from "utilities"
import { Logger } from "../lib/logger"
import { BN } from "bn.js"

let config = getConfig()
let connection = await NearConncetion.build(config)

let masterAcc = await getAccFromFile(config.master.keyPath, connection)
let owner = process.env.OWNER_ACC
assert(isString(owner), "OWNER_ACC not set")
let tokens = {
  cheddar: "token.cheddar.testnet",
  stNear: "meta-v2.pool.testnet",
  meta: "token.meta.pool.testnet"
}
export const tokenTypes = {
  token1: "token1",
  token2: "token2",
  token3: "token3",
  token4: "token4",
  token5: "token5"
}
// await deployNFTSimple(owner, masterAcc)
// let nftSimpleAcc = await getExistentAcc(config.existentAcc.nft_simple.name, connection, config.existentAcc.nft_simple.key)
// await deployMarket(owner, nftSimpleAcc)

await deployPools(config.existentAcc.owner.name, masterAcc, connection)

await evalFromTerminal(this)


async function deployPools(ownerAcc: string, masterCPoolAcc: Account, connection: NearConncetion) {
  // create the pool accounts as sub accounts
  // let metaPoolAcc = await createSubAccount(masterCPoolAcc, connection, "metapool", { near: 10 })
  // Logger.info("created market account: id: " + metaPoolAcc.accountId + " key: " + await getKey(metaPoolAcc, connection), true)
  // let stNearPoolAcc = await createSubAccount(masterCPoolAcc, connection, "stnearpool", { near: 10 })
  // Logger.info("created market account: id: " + stNearPoolAcc.accountId + " key: " + await getKey(stNearPoolAcc, connection), true)
  // let cheddarPoolAcc = await createSubAccount(masterCPoolAcc, connection, "cheddarpool", { near: 10 })
  // Logger.info("created market account: id: " + cheddarPoolAcc.accountId + " key: " + await getKey(cheddarPoolAcc, connection), true)
  // let treasuryAcc = await createSubAccount(masterCPoolAcc, connection, "treasury", { near: 10 })
  // Logger.info("created market account: id: " + treasuryAcc.accountId + " key: " + await getKey(treasuryAcc, connection), true);

  let metaPoolAcc = await getExistentAcc(config.existentAcc.metapool.name, connection, config.existentAcc.metapool.key)
  let stNearPoolAcc = await getExistentAcc(config.existentAcc.stnearpool.name, connection, config.existentAcc.metapool.key)
  let cheddarPoolAcc = await getExistentAcc(config.existentAcc.cheddarpool.name, connection, config.existentAcc.cheddarpool.key)
  let treasuryAcc = await getExistentAcc(config.existentAcc.pooltreasury.name, connection, config.existentAcc.pooltreasury.key)

  let metaPoolCtr = new Contract(metaPoolAcc, contracts.pool, "metapool")
  let stNearPoolCtr = new Contract(stNearPoolAcc, contracts.pool, "stNearpool")
  let cheddarPoolCtr = new Contract(cheddarPoolAcc, contracts.pool, "cheddarpool")

  let cheddarTokenCtr = new Contract(tokens.cheddar, contracts.testToken, "cheddartoken")
  let metaTokenCtr = new Contract(tokens.meta, contracts.testToken, "metatoken")
  let stNearTokenCtr = new Contract(tokens.stNear, contracts.testToken, "stneartoken")

  // await deployContract(metaPoolCtr.account, metaPoolCtr.spec)
  // await deployContract(stNearPoolCtr.account, stNearPoolCtr.spec)
  // await deployContract(cheddarPoolCtr.account, cheddarPoolCtr.spec)

  // Logger.info("finished deploying contracts", true);

  // instantiate pools
  // 10 days in the future
  let closeDate = Date.now() + 863957*3

  let poolCtrNewParams = {
    owner_id: ownerAcc,
    staked_token: "",
    treasury: treasuryAcc.accountId,
    returnable: false,
    closing_date: closeDate
  }
  // Logger.info("instantiating cheddar", true);
  // poolCtrNewParams.staked_token = tokens.cheddar
  // await cheddarPoolCtr.call.new(
  //   null,
  //   poolCtrNewParams
  // )
  // Logger.info(await cheddarPoolCtr.view.get_contract_params(null))
  // Logger.info("instantiating meta", true);
  // poolCtrNewParams.staked_token = tokens.meta
  // await metaPoolCtr.call.new(
  //   null,
  //   poolCtrNewParams
  // )
  // Logger.info(await metaPoolCtr.view.get_contract_params(null))
  // Logger.info("instantiating stNear", true);
  // poolCtrNewParams.staked_token = tokens.stNear
  // await stNearPoolCtr.call.new(
  //   null,
  //   poolCtrNewParams
  // )
  // Logger.info(await stNearPoolCtr.view.get_contract_params(null))


  //Register each pool account in their token contract
  Logger.info("register accounts in tokens", true);
  // Logger.info("registering cheddar pool", true);
  // await cheddarTokenCtr.call.storage_deposit(
  //   cheddarPoolAcc,
  //   {
  //     account_id: cheddarPoolAcc.accountId
  //   },
  //   undefined,
  //   new BN((await cheddarTokenCtr.view.storage_balance_bounds(cheddarPoolAcc)).min)
  // )
  // Logger.info("registering meta pool", true);
  // await metaTokenCtr.call.storage_deposit(
  //   metaPoolAcc,
  //   {
  //     account_id: metaPoolAcc.accountId
  //   },
  //   undefined,
  //   new BN((await metaTokenCtr.view.storage_balance_bounds(metaPoolAcc)).min)
  // )
  Logger.info("registering stNear pool", true);
  await stNearTokenCtr.call.storage_deposit(
    stNearPoolAcc,
    {
      account_id: stNearPoolAcc.accountId
    },
    undefined,
    new BN((await stNearTokenCtr.view.storage_balance_bounds(stNearPoolAcc)).min)
  )
}
async function deployMarket(ownerAcc: string, baseAcc: Account) {

  // let marketAcc = await createSubAccount(baseAcc, connection, "market", { near: 10 })
  let marketAcc = await getExistentAcc(config.existentAcc.market.name, connection, config.existentAcc.market.key)
  Logger.info("created market account: id: " + marketAcc.accountId + " key: " + await getKey(marketAcc, connection), true);

  let marketCtr = new Contract(marketAcc, contracts.market, "market")
  await deployContract(marketCtr.account, marketCtr.spec)

  Logger.info("finished deploying contract", true);

  // instantiate contract
  Logger.info("instantiate market contract", true)
  await marketCtr.call.new(
    null,
    {
      owner_id: ownerAcc
    }
  )
}

async function deployNFTSimple(ownerAcc: string, masterAccount: Account) {

  let nftAcc = await createSubAccount(masterAccount, connection, "nft-simple", {near:20})

  Logger.info("created nft-simple account: id: " + nftAcc.accountId + " key: " + await getKey(nftAcc, connection), true);

  let nftCtr = new Contract(nftAcc, contracts.nft, "nft-simple")
  await deployContract(nftCtr.account, nftCtr.spec)

  Logger.info("finished deploying contract", true);

  // instantiate contract
  Logger.info("instantiate market contract", true)

  await nftCtr.call.new(
    null,
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


  // await loadContract(testTokenContractAcc, testTokenContractAcc.accountId, contractTestToken)

  //Instantiate Test token contract
  // console.log("Instantiate Test token contract");
  // await testTokenContractAcc[]["new"](
  //   {
  //     owner_id: ownerAcc.accountId
  //   }
  // )
  // assert(await testTokenContractAcc["get_owner_id"]() === ownerAcc.accountId, util.err("test token new"))