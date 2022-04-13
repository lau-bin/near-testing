import { Logger } from "near-utils"
import {deployKatherineFundraising, deployTestMetapool} from "./util.js"

let metapool = await deployTestMetapool("10000000000")
if (!metapool){
  throw "metapool is undefined"
}
let kaherine = await deployKatherineFundraising(metapool.contract_account.accountId, "100", 1)

if (!kaherine){
  throw "katherine is undefined"
}

Logger.info(metapool, true)
Logger.info(kaherine, true)

