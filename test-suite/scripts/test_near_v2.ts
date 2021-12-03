import * as HTTPS from "https";
import { Transaction, createTransaction, Action } from "near-api-js/lib/transaction";

const NETWORK: Network = "local"
const RPC_VER = "2.0"

const config = (() => {
  switch (NETWORK) {
    case "local":
      return {
        networkId: "sandbox",
        nodeUrl: "http://localhost:3030",
        existentAcc:{
          master:{
            keyPath: "/tmp/near-sandbox/validator_key.json",
          }
        }
      }
  }
})()

class ChangeTransaction {

  private payload: string

  constructor(params: ContractParams){
    this.payload = JSON.stringify(params)
  }
  
  send(rpcData: RPCData): string{
    const tr = {
      jsonrpc: rpcData.version,
      id: "unused",
      method: "broadcast_tx_async",
      params: this.payload
    }
    
  }
  sendSync(rpcData: RPCData){
    const tr = {
      jsonrpc: RPC_VER,
      id: "unused",
      method: "broadcast_tx_commit",
      params: this.payload
    }

  }




}

class ViewTransaction{

}

function callContract(){
  
}

function newTransaction(){
  createTransaction()
}
 

// function sendHttpsReq(){
//   let options = {
//     hostname: 'posttestserver.com',
//     port: 443,
//     path: '/post.php',
//     method: 'POST',
//     headers: {
//          'Content-Type': 'application/x-www-form-urlencoded',
//          'Content-Length': postData.length
//        }
//   }
// }