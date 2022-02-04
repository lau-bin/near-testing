import { existsSync, mkdirSync, readFileSync } from "fs"
import path from "path"
import { NetworkId } from "./near-connection"
import { hasValue, assert } from "utilities"

export function getConfig(): NetworkConfig<Network> {
  let network = process.env.NETWORK
  let accounts = process.env.ACCOUNTS_PATH
  let accountMap: Map<string, string>
  assert(hasValue(network), "export NETWORK env")
  let config: NetworkConfig<Network>
  switch (network) {
    case "local":
      config = {
        networkId: "sandbox",
        nodeUrl: "http://localhost:3030",
        master: {
          keyPath: "/tmp/near-sandbox/validator_key.json",
        }
      } as NetworkConfig<"local">
      break
    case "testnet":
      config = {
        networkId: "testnet",
        nodeUrl: "https://rpc.testnet.near.org",
        existentAcc: {
        },
        master: {
          keyPath: process.env.TEST_ACCOUNT!
        }
      }
      break
    default:
      throw Error("network type not implemented")
  }
  if (hasValue((config as any).existentAcc)){
    if (hasValue(accounts)) {
      accountMap = JSON.parse(readFileSync(accounts).toString())
      Object.entries(accountMap).forEach(pair => {
        Object.defineProperty((config as any).existentAcc, pair[0], {
          writable: false,
          enumerable: true,
          value: pair[1]
        })
      });
    }
  }

  return config
}

export const logFile = (function () {
  try {
    let date = new Date()
    let file = process.env.LOGFILE || path.join(global.__dirname, "logs", `log_${date.getDay()}:${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}.txt`)
    if (!existsSync(path.dirname(file))) {
      mkdirSync(path.dirname(file))
    }
    return file
  }
  catch (e) {
    throw Error("error creating log file: " + e)
  }
})()

export type Network = "local" | "testnet" | "betanet" | "mainnet"
export type NetworkConfig<T extends Network, B = T extends "local" ? never : _NetworkConfigRemote> = {
  networkId: NetworkId,
  nodeUrl: string,
  master: {
    keyPath: string
  }
} & B
type _NetworkConfigRemote = {
  existentAcc: {
    [prop: string]: {
      name: string
      key: string
    }
  }
}