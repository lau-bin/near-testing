import { Logger } from "near-utils"
import {deployKatherineFundraising, deployTestMetapool} from "./util.js"

let metapool = await deployTestMetapool("10000000000")
if (!metapool){
  throw ""
}
let katerine = await deployKatherineFundraising(metapool.contract_account.accountId, "100", 1)
if (!katerine){
  throw ""
}

Logger.info(metapool)
Logger.info(katerine)