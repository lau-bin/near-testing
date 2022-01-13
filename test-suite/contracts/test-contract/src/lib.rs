use near_contract_standards::fungible_token::receiver::*;
use near_sdk::{env, PromiseOrValue, Balance, AccountId, ext_contract, near_bindgen};
use near_sdk::json_types::{U128};
use near_sdk::borsh::{self, BorshDeserialize, BorshSerialize};

const NO_DEPOSIT: Balance = 0;


#[near_bindgen]
#[derive(BorshDeserialize, BorshSerialize)]
pub struct Contract{
    pub account: AccountId

}
#[near_bindgen]
impl Contract {
    #[init]
    pub fn new(account_id: AccountId)->Self{
        return Self{
            account: account_id.into()
        };
    }
    pub fn dummy()->PromiseOrValue<U128>{
        PromiseOrValue::Promise(contract_dummy::dummy(
            env::current_account_id(),
            NO_DEPOSIT,
            env::prepaid_gas()
        ))
    }
    pub fn transfer(&self, token_ctr: AccountId, amount: U128)->U128{
        token_contract::ft_transfer_call(
            self.account.clone(),
            amount,
            None,
            "no_error".to_owned(),
            token_ctr,
            NO_DEPOSIT,
            env::prepaid_gas() - 10_000_000_000_000.into()
        );
        panic!();
    }
    pub fn transfer_wait(&self, token_ctr: AccountId, amount: U128)->PromiseOrValue<U128>{
        token_contract::ft_transfer_call(
            self.account.clone(),
            amount,
            None,
            "no_error".to_owned(),
            token_ctr,
            NO_DEPOSIT,
            env::prepaid_gas() - 150_000_000_000_000.into()
        );
        PromiseOrValue::Promise(contract_dummy::dummy(
            env::current_account_id(),
            NO_DEPOSIT,
            env::prepaid_gas() - 10_000_000_000_000.into()
        ))
    }
}
impl Default for Contract{
    fn default()-> Contract{
        return Self{
            account: env::current_account_id()
        };
    }
}
#[allow(unused_variables)]
#[near_bindgen]
impl FungibleTokenReceiver for Contract{
    fn ft_on_transfer(
        &mut self,
        sender_id: AccountId,
        amount: U128,
        msg: String,
    ) -> PromiseOrValue<U128>{
        match msg.as_ref() {
            "ddos" => PromiseOrValue::Promise(contract_dummy::dummy(
                                        env::current_account_id(),
                                        NO_DEPOSIT,
                                        env::prepaid_gas() - 10_000_000_000_000.into()
                                    )),
            "transfer_before_throw" => PromiseOrValue::Value(
                self.transfer(env::predecessor_account_id(), amount)
            ),
            "transfer_and_wait_out_of_gas" => self.transfer_wait(env::predecessor_account_id(), amount),
            "no_error" => PromiseOrValue::Value(
                0.into()
            ),
            _ => PromiseOrValue::Value(0.into())
        }

    }
}

#[ext_contract(contract_dummy)]
pub trait ContractDummy {
    fn dummy(
        &mut self,
    ) -> PromiseOrValue<U128>;
}
#[ext_contract(token_contract)]
pub trait FungibleTokenCore{
    fn ft_transfer(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        #[allow(unused)] memo: Option<String>,
    );
    fn ft_transfer_call(
        &mut self,
        receiver_id: AccountId,
        amount: U128,
        #[allow(unused)] memo: Option<String>,
        msg: String,
    ) -> PromiseOrValue<U128>;
    fn ft_total_supply(&self) -> U128;

    fn ft_balance_of(&self, account_id: AccountId) -> U128;
}