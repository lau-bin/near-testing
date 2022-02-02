import { existsSync, mkdirSync, readFileSync } from "fs"
import path from "path"
import { NetworkId } from "util/near-connection"
import {hasValue, assert} from "utilities"

export function getConfig(): NetworkConfig {
  let network = process.env.NETWORK
  assert(hasValue(network), "export NETWORK env")
  
  switch (network) {
    case "local":
      return {
        networkId: "sandbox",
        nodeUrl: "http://localhost:3030",
        existentAcc: {
          master: {
            keyPath: "/tmp/near-sandbox/validator_key.json",
          }
        }
      }
    case "testnet":
      return {
        networkId: "testnet",
        nodeUrl: "https://rpc.testnet.near.org",
        existentAcc: {
          master: {
            keyPath: "/home/god/.near-credentials/testnet/hardcoder.testnet.json"
          }
        }
      }
    default:
      throw Error("network type not implemented")
  }
}

export const logFile = (function () {
  try {
    let file = process.env.LOGFILE || path.join(__dirname, "res", "log.txt")
    mkdirSync(path.dirname(file))
    return file
  }
  catch (e) {
    throw Error("error creating log file")
  }
})()

export type Network = "local" | "testnet" | "betanet" | "mainnet"
export type NetworkConfig = {
  networkId: NetworkId,
  nodeUrl: string,
  existentAcc: {
    [prop: string]: {
      keyPath: string
    }
  }
}