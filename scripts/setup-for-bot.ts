import { assert, hasValue } from "@h4rdcoder/js-utils"
import { BN } from "bn.js"
import { katerine_ctr } from "contracts/contract-spec.js"
import { Account } from "near-api-js"
import { format } from "near-api-js/lib/utils"
import { createSubAccount, Logger } from "near-utils"
import {config, connection, deployKatherineFundraising, deployTestMetapool, deployTestToken, master_acc} from "./util.js"



let metapool = await deployTestMetapool("1000")
assert(hasValue(metapool), "metapool is undefined")
Logger.info("metapool data", true)
Logger.info(metapool)

let katherine = await deployKatherineFundraising(metapool!.contract_account.accountId, "10", 1)
assert(hasValue(katherine), "metapool is undefined")
Logger.info("kaherine data", true)
Logger.info(katherine)
Logger.info("owner key: ", true)
Logger.info(await connection.keyStore.getKey(connection.networkId, (katherine.owner_account as Account).accountId), true)

let test_token = await deployTestToken("1000")
assert(hasValue(test_token), "metapool is undefined")
Logger.info("test_token data", true)
Logger.info(test_token)

let kickstarter_owner = await createSubAccount(master_acc, connection, "kickstarter-owner", {near:10, nameSuffixLength:5})
let supporter = await createSubAccount(master_acc, connection, "supporter", {near:10, nameSuffixLength:5})


// register them

await metapool.metapool_ctr.call.register_account(
  null,
  {
    account_id: katherine.contract_account.accountId
  }
)
await metapool.metapool_ctr.call.register_account(
  null,
  {
    account_id: supporter.accountId
  }
)
await metapool.metapool_ctr.call.ft_transfer(
  metapool.owner_account,
  {
    amount: format.parseNearAmount("100")!,
    receiver_id: supporter.accountId
  },
  undefined,
  new BN(1)
)

await test_token.token_ctr.call.register_account(
  null,
  {
    account_id: katherine.contract_account.accountId
  }
)

await test_token.token_ctr.call.register_account(
  null,
  {
    account_id: kickstarter_owner.accountId
  }
)

await test_token.token_ctr.call.ft_transfer(
  test_token.owner_account,
  {
    amount: format.parseNearAmount("100")!,
    receiver_id: kickstarter_owner.accountId
  },
  undefined,
  new BN(1)
)

// create kickstarter and goal
let date: Date
date = new Date()
date.setSeconds(date.getSeconds()+10)

let kickstarter_id = await katherine.katerine_ctr.call.create_kickstarter(
  katherine.owner_account,
  {
    owner_id: kickstarter_owner.accountId,
    name: "kick1",
    slug: "K1",
    deposits_hard_cap: format.parseNearAmount("30")!,
    token_contract_address: test_token.contract_account.accountId,
    max_tokens_to_release_per_stnear: format.parseNearAmount("1")!,
    open_timestamp: date.getTime(),
    close_timestamp: (()=>{date.setMinutes(date.getMinutes()+1); return date.getTime()})()
  }
)

let k_id = Number.parseInt(atob((kickstarter_id.status as any).SuccessValue as string))
await katherine.katerine_ctr.call.create_goal(
  kickstarter_owner,
  {
    name: "goal1",
    kickstarter_id: k_id,
    desired_amount: "10",
    tokens_to_release_per_stnear: format.parseNearAmount("1")!,
    end_timestamp: date.getTime(),
    cliff_timestamp: (()=>{date.setSeconds(date.getSeconds()-30); return date.getTime()})(),
    reward_installments: 1,
    unfreeze_timestamp: (()=>{date.setMinutes(date.getMinutes()+1); return date.getTime()})()
  }
)

await test_token.token_ctr.call.ft_transfer_call(
  kickstarter_owner,
  {
    amount: format.parseNearAmount("40")!,
    receiver_id: katherine.contract_account.accountId,
    msg: String(k_id)
  },
  undefined,
  new BN(1)
)
await metapool.metapool_ctr.call.ft_transfer_call(
  supporter,
  {
    amount: format.parseNearAmount("20")!,
    receiver_id: katherine.contract_account.accountId,
    msg: String(k_id)
  },
  undefined,
  new BN(1)
)


Logger.info("all done", true)