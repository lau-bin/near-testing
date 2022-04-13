import { _ContractSpec } from "near-utils";
import { asConst } from "@h4rdcoder/js-utils";
const ContractSpec = asConst<_ContractSpec>()

export const katerine_ctr = ContractSpec({
  name: "katerine",
  wasmName: "katherine_fundraising_contract.wasm",
  changeMethods: [
    {
      name: "new",
      returnValue: undefined,
      args: {
        owner_id: "",
        min_deposit_amount: "",
        metapool_contract_address: "",
        katherine_fee_percent: 0 
      }
    },
    {
      name: "process_kickstarter",
      returnValue: undefined,
      args: {
        kickstarter_id: 0
      }
    },
    {
      name: "unfreeze_kickstarter_funds",
      returnValue: undefined,
      args: {
        kickstarter_id: 0
      }
    },
    {
      name: "withdraw_all",
      returnValue: undefined,
      args: {
        kickstarter_id: 0
      }
    },
    {
      name: "withdraw",
      returnValue: undefined,
      args: {
        amount: "",
        kickstarter_id: 0
      }
    },
    {
      name: "withdraw_kickstarter_tokens",
      returnValue: undefined,
      args:{
        amount: "",
        kickstarter_id: 0
      }
    },
    {
      name: "withdraw_stnear_interest",
      returnValue: undefined,
      args:{
        kickstarter_id: 0,
        amount: ""
      }
    },
    {
      name: "kickstarter_withdraw_excedent",
      returnValue: undefined,
      args:{
        kickstarter_id: 0
      }
    },
    {
      name: "create_kickstarter",
      returnValue: 0,
      args: {
        name: "",
        slug: "",
        owner_id: "",
        open_timestamp: "",
        close_timestamp: "",
        token_contract_address: "",
      }
    },
    {
      name: "update_kickstarter",
      returnValue: undefined,
      args: {
        id: 0,
        name: "",
        slug: "",
        owner_id: "",
        open_timestamp: "",
        close_timestamp: "",
        token_contract_address: "",
      }
    }
  ],
  viewMethods: [
    {
      name: "get_kickstarters_to_process",
      returnValue: "" as unknown as {
        successful: Array<number>,
        unsuccessful: Array<number>,
      } | null,
      args: {
        from_index: "",
        limit: ""
      }
    },
    {
      name: "get_supporter_total_rewards",
      returnValue: 0,
      args: {
        supporter_id: "",
        kickstarter_id: 0
      }
    },
    {
      name: "get_supporter_available_rewards",
      returnValue: 0,
      args: {
        supporter_id: "",
        kickstarter_id: 0
      }
    },
    {
      name: "get_active_projects",
      returnValue: "" as unknown as {
        active: Array<number>,
        open: Array<number>,
      } | null,
      args: {
        from_index: "",
        limit: "",
      }
    },
    {
      name: "get_project_details",
      returnValue: "" as unknown as {
        id: number,
        total_supporters: number,
        total_deposited: string,
        open_timestamp: number,
        close_timestamp: number,
        token_contract_address: string,
        stnear_price_at_freeze: string,
        stnear_price_at_unfreeze: string,
        goals: Array<{
          id: number,
          name: string,
          desired_amount: string,
          unfreeze_timestamp: number,
          tokens_to_release: string,
          cliff_timestamp: number,
          end_timestamp: number,
        }>,
        active: boolean,
        successful: boolean | null,
      },
      args: {
        kickstarter_id: 0
      }
    },
    {
      name: "get_kickstarters",
      returnValue: "" as unknown as {
        id: number,
        total_supporters: number,
        total_deposited: string,
        open_timestamp: number,
        close_timestamp: number,
      },
      args: {
        from_index: "",
        limit: ""
      }
    },
    {
      name: "get_kickstarter",
      returnValue: "" as unknown as {
        id: number,
        total_supporters: number,
        total_deposited: string,
        open_timestamp: number,
        close_timestamp: number,
      },
      args: {
        kickstarter_id: 0
      }
    },
    {
      name: "get_total_kickstarters",
      returnValue: 0,
      args: undefined
    },
    {
      name: "get_kickstarter_id_from_slug",
      returnValue: 0,
      args: {
        slug: ""
      }
    },
    {
      name: "get_kickstarter_total_goals",
      returnValue: 0,
      args: {
        kickstarter_id: 0
      }
    },
    {
      name: "get_kickstarter_goal",
      returnValue: "" as unknown as {
        id: number,
        name: string,
        desired_amount: string,
        unfreeze_timestamp: number,
        tokens_to_release: string,
        cliff_timestamp: number,
        end_timestamp: number,
      },
      args: {
        kickstarter_id: 0,
        goal_id: 0
      }
    },
    {
      name: "get_supporter_total_deposit_in_kickstarter",
      returnValue: "",
      args: {
        supporter_id: "",
        kickstarter_id: 0,
      }
    },
    {
      name: "get_supporter_estimated_stnear",
      returnValue: "",
      args: {
        supporter_id: "",
        kickstarter_id: 0,
        st_near_price: "",
      }
    },
    {
      name: "get_supported_projects",
      returnValue: "" as unknown as Array<number>,
      args: {
        supporter_id: ""
      }
    },
    {
      name: "get_supported_detailed_list",
      returnValue: "" as unknown as Array<{
        kickstarter_id: number,
        supporter_deposit: string,
        active: boolean,
        successful: boolean | null,
      }> | null,
      args: {
        supporter_id: "",
        from_index: "",
        limit: "",
      }
    }
  ]
})
export const metapool_ctr = ContractSpec({
  name: "metapool",
  wasmName: "test_meta_pool.wasm",
  changeMethods: [
    {
      name: "new_default_meta",
      returnValue: undefined,
      args: {
        owner_id: "",
        total_supply: ""
      }
    }
  ],
  viewMethods: [
    {
      name: "get_st_near_price",
      returnValue: "",
      args: undefined
    }
  ]
})