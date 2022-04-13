import { hasValue } from "@h4rdcoder/js-utils"
import { existsSync, readdirSync } from "fs"
import { Account } from "near-api-js"
import { parseNearAmount } from "near-api-js/lib/utils/format.js"
import { getConfig, Network, Contract, NearConncetion, getAccFromFile, deployContract, createSubAccount, Logger, askWhatToExecute } from "near-utils"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

//@ts-ignore
export const __dirname = dirname(fileURLToPath(import.meta.url))
export const config = getConfig("local")
export var connection = await NearConncetion.build(config)
export var master_acc: Account

try {
  master_acc = await getAccFromFile(config.master!.keyPath, connection)
} catch (e) {
  Logger.error("error geting master account from the file", true)
  Logger.error(e as any, true)
}
var executing_script
  if (process.env.TARGET_SCRIPT) {
    executing_script = process.env.TARGET_SCRIPT
  }
  else {
    var script_files = readdirSync(__dirname)
    var script_names = script_files.filter(s => {
      if (s !== "util.ts" && s.endsWith(".ts")) {
        return true
      }
      return false
    }).map(s => s.substring(0, s.indexOf('.')))

    if (script_names.length == 0) {
      Logger.info("there are no scripts to run", true)
      process.exit()
    }
    executing_script = await askWhatToExecute(script_names)
  }

  var script_path = join(__dirname, executing_script + ".ts")

  if (!existsSync(script_path)) {
    Logger.error("error detecting script: " + script_path, true)
    process.exit()
  }
  import(script_path)
    .then(() => Logger.info("done.", true))
    .catch((e) => Logger.error(e, true))


export async function deployKatherineFundraising(
  metapool_address: string,
  min_deposit_amount_in_near: string,
  katherine_fee_percent: number
) {
  try {
    let contract_spec = await import("../contracts/contract-spec.js")
    let contract_account = await createSubAccount(master_acc, connection, "katerine-ctr", { near: 10, nameSuffixLength: 5 })
    let owner_account = await createSubAccount(master_acc, connection, "katerine-owner", { near: 1, nameSuffixLength: 5 })
    let min_dep_amount = parseNearAmount(min_deposit_amount_in_near)
    let katerine_ctr = new Contract(contract_account, contract_spec.katerine_ctr, "katerine_ctr")

    if (!hasValue(min_dep_amount)) {
      throw "error converting min_deposit_amount to yocto"
    }
    await deployContract(contract_account, join(__dirname, "..", "res", contract_spec.katerine_ctr.wasmName))
    await katerine_ctr.call.new(
      master_acc,
      {
        owner_id: owner_account.accountId,
        min_deposit_amount: min_dep_amount,
        metapool_contract_address: metapool_address,
        katherine_fee_percent: katherine_fee_percent
      }
    )
    return {
      katerine_ctr,
      owner_account,
      contract_account
    }
  } catch (e) {
    Logger.error("error deploying katerine contract", true)
    Logger.error(e as any, true)
  }
}

export async function deployTestMetapool(
  _total_supply: string
) {
  try {
    let contract_spec = await import("../contracts/contract-spec.js")
    let contract_account = await createSubAccount(master_acc, connection, "metapool-ctr", { near: 10, nameSuffixLength: 5 })
    let owner_account = await createSubAccount(master_acc, connection, "metapool-owner", { near: 1, nameSuffixLength: 5 })
    let total_supply = parseNearAmount(_total_supply)
    let metapool_ctr = new Contract(contract_account, contract_spec.metapool_ctr, "metapool_ctr")

    if (!hasValue(total_supply)) {
      throw "error converting total_supply to yocto"
    }
    await deployContract(contract_account, join(__dirname, "..", "res", contract_spec.metapool_ctr.wasmName))
    await metapool_ctr.call.new_default_meta(
      master_acc,
      {
        owner_id: owner_account.accountId,
        total_supply
      }
    )
    return {
      metapool_ctr,
      owner_account,
      contract_account
    }
  } catch (e) {
    Logger.error("error deploying metapool contract", true)
    Logger.error(e as any, true)
  }
}
