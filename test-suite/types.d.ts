type Network = "local" | "testnet" | "betanet" | "mainnet"
type RPCResponse = string
type Transaction = string
interface RPCData {
  version: string
}
interface ContractSpec{
  changeMethods:[string]
  viewMethods: [string]
} 
