import BN from "bn.js"
import { Account } from "near-api-js"
import {getTransactionLastResult, FinalExecutionStatus} from "near-api-js/lib/providers/provider"
import {asConst} from "utilities"

export class Contract<T extends _ContractSpec>{

  contractAccountId: string
  view: Record<T["viewMethods"][number], (any:any)=> any> = {} as any
  call: Record<T["changeMethods"][number], (any:any)=> any> = {} as any
  name: string

  constructor(contractAccountId: string, contractSpec: T, name?: string){
    this.name = name || contractSpec.name
    this.contractAccountId = contractAccountId
    contractSpec.changeMethods.forEach(methodName=>{
      const fun = async (account: Account, args:Object, gas:BN = new BN(300000000000000), attachedDeposit:BN = new BN(0))=>{
        const element = {
          contractId: this.contractAccountId,
          methodName,
          args,
          gas,
          attachedDeposit
        } 
        const rawResult = await account.functionCall(element);
        if ((rawResult?.status as FinalExecutionStatus).SuccessValue !== ''){
          return await getTransactionLastResult(rawResult);
        }else{
          return
        }
      }
      
      Object.defineProperty(this.call, methodName, {
        writable: false,
        enumerable: true,
        value: fun
      })
    })

    contractSpec.viewMethods.forEach(methodName=>{
      Object.defineProperty(this.view, methodName, {
        writable: false,
        enumerable: true,
        value: async function (account: Account, args:any){
          return await account.viewFunction(this.contractAccountId, methodName, args);
        }
      })
    })
  }
}


export type _ContractSpec = {
  changeMethods: readonly string[]
  viewMethods: readonly string[]
  wasmName: string
  name: string
}
export const ContractSpec = asConst<_ContractSpec>()
