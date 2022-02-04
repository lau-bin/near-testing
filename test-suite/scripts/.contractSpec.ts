import {ContractSpec} from "../lib/contract"

export const contracts = {
  nft: ContractSpec({
    name: "nft-simple",
    viewMethods: [
      "get_contract_royalty",
      "get_supply_caps",
      "get_token_types_locked",
      "is_token_locked",
      "nft_is_approved"
    ],
    changeMethods: [
      "new",
      "set_contract_royalty",
      "add_token_types",
      "unlock_token_types",
      "nft_mint",
      "nft_transfer",
      "nft_transfer_payout",
      "nft_transfer_call",
      "nft_approve",
      "nft_revoke",
      "nft_revoke_all",
      "nft_total_supply",
      "nft_token",
      "nft_tokens",
      "nft_tokens_batch",
      "nft_supply_for_type",
      "nft_tokens_for_type",
      "nft_supply_for_owner",
      "nft_tokens_for_owner"
    ],
    wasmName: "nft_simple.wasm"
  }),
  testToken: ContractSpec({
    name: "test-token",
    viewMethods: [
      "get_owner_id",
      "get_locked_amount",
      "get_owner",
      "get_vesting_info",
      "storage_balance_bounds",
      "storage_balance_of"
    ],
    changeMethods: [
      "new",
      "ft_mint",
      "self_burn",
      "add_minter",
      "remove_minter",
      "set_metadata_icon",
      "set_metadata_reference",
      "set_owner",
      "mint_vested",
      "cancel_vesting",
      "ft_transfer",
      "ft_transfer_call",
      "ft_total_supply",
      "ft_balance_of",
      "ft_resolve_transfer",
      "ft_metadata",
      "storage_deposit",
      "storage_withdraw",
      "storage_unregister"



    ],
    wasmName: "test_token_nep145.wasm"
  }),
  pool: ContractSpec({
    name: "cookie-factory-pool",
    viewMethods: [
      "get_contract_params",
      "status",
      "storage_balance_bounds",
      "storage_balance_of"
    ],
    changeMethods: [
      "new",
      "unstake",
      "close",
      "set_active",
      "set_closing_date",
      "storage_deposit",
      "storage_unregister",
      "get_registered_accounts"

    ],
    wasmName: "cookie_factory_st_pool.wasm"
  }),
  market: ContractSpec({
    name: "cookie-factory-market",
    viewMethods: [
      "get_contract_params",
      "status",
      "storage_balance_bounds",
      "storage_balance_of"
    ],
    changeMethods: [
      "new",
      "unstake",
      "close",
      "set_active",
      "set_closing_date",
      "storage_deposit",
      "storage_unregister",
      "get_registered_accounts"

    ],
    wasmName: "nft_market.wasm"
  })
}
