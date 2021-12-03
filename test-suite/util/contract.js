const providers = require("near-api-js/lib/providers/provider");

module.exports = class Contract{

  account
  contractAccount

  constructor(userAccount, contractAccount, contract){
    this.account = userAccount
    this.contractAccount = contractAccount

    contract.changeMethods.forEach(name=>{
      const fun = async function (args, gas, amount){
        const element = {
          contractId: this.contractAccount.accountId,
          methodName: name,
          args,
          gas: gas || 300000000000000,
          attachedDeposit: amount || 0
        } 
        const rawResult = await this.account.functionCall(element);
        if (rawResult?.status?.SuccessValue !== ''){
          return await providers.getTransactionLastResult(rawResult);
        }else{
          return
        }
      }
      
      Object.defineProperty(this, name, {
        writable: false,
        enumerable: true,
        value: fun
      })
    })

    contract.viewMethods.forEach(name=>{
      Object.defineProperty(this, name, {
        writable: false,
        enumerable: true,
        value: async function (args){
          return await this.account.viewFunction(this.contractAccount.accountId, name, args);
        }
      })
    })
  }
}