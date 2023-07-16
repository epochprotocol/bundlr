import { UserOperationStruct } from "@account-abstraction/contracts";
import { TransactionRequest } from "@ethersproject/abstract-provider";
import { BigNumberish } from "ethers/lib/ethers";

export interface AdvancedTransactionStruct extends TransactionRequest {
  advancedUserOperation?: AdvancedUserOperation | undefined;
}

export interface AdvancedUserOperation {
  executionWindowStart?: BigNumberish;
  executionWindowEnd?: BigNumberish;
  readyForExecution?: boolean | undefined;
}
