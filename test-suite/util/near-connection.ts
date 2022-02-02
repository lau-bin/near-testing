import { NetworkConfig } from "config";
import { copyFile } from "fs";
import {keyStores, connect, Near} from "near-api-js"
import {hasValue} from "utilities"

export class NearConncetion {
  keyStore = new keyStores.InMemoryKeyStore();
  private _near?: Near
  networkId: NetworkId

  private constructor(networkId: NetworkId){
    this.networkId = networkId
  }

  static async build(config: NetworkConfig){
    let instance = new this(config.networkId)
    instance._near = await connect({
      keyStore: instance.keyStore,
      networkId: config.networkId,
      nodeUrl: config.nodeUrl,
    });
    return instance
  }

  get near(){
    return this._near!
  }
}
export type NetworkId = "sandbox" | "testnet"
