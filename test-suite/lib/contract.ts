import BN from "bn.js"
import { Account } from "near-api-js"
import {getTransactionLastResult, FinalExecutionStatus} from "near-api-js/lib/providers/provider"
import {asConst, hasValue, isString} from "utilities"

export class Contract<T extends _ContractSpec, S extends Account | string> {

  accountId: string
  account: S extends Account ? Account : null
  view: Record<T["viewMethods"][number], (account: S extends Account ? Account | null : Account, args?:Object)=> Promise<any>> = {} as any
  call: Record<T["changeMethods"][number], (account: S extends Account ? Account | null : Account, args?:Object, gas?:BN, attachedDeposit?:BN)=> Promise<any>> = {} as any
  name: string
  spec: T

  constructor(accountOrId: S, contractSpec: T, name?: string){
    this.spec = contractSpec
    this.name = name || contractSpec.name
    if (!isString(accountOrId)){
      this.accountId = accountOrId.accountId
      this.account = accountOrId as any
    }
    else{
      this.accountId = accountOrId
      this.account = null as any
    }
    contractSpec.changeMethods.forEach(methodName=>{
      const fun = async (account?: Account, args?:Object, gas:BN = new BN(300000000000000), attachedDeposit:BN = new BN(0))=>{
        const element = {
          contractId: this.accountId,
          methodName,
          args: args ?? {},
          gas,
          attachedDeposit
        } 
        let caller = hasValue(account) ? account : this.account as Account
        const rawResult = await caller.functionCall(element);
        if ((rawResult?.status as FinalExecutionStatus).SuccessValue !== ''){
          return getTransactionLastResult(rawResult);
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
      const fun = async (account?: Account, args?:Object)=>{
        let caller = hasValue(account) ? account : this.account as Account
        return await caller.viewFunction(this.accountId, methodName, args);
      }
      Object.defineProperty(this.view, methodName, {
        writable: false,
        enumerable: true,
        value: fun
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
 