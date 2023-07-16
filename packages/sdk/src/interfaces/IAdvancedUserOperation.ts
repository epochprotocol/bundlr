import { UserOperationStruct } from "@account-abstraction/contracts";
import { BigNumberish } from "ethers/lib/ethers";

export interface AdvancedUserOperationStruct extends UserOperationStruct {
  advancedUserOperation?: AdvancedUserOperation | undefined;
}

export interface AdvancedUserOperation {
  executionWindowStart?: BigNumberish;
  executionWindowEnd?: BigNumberish;
  readyForExecution?: boolean | undefined;
  triggerEvent?: TriggerEvent;
}

export interface CustomUserOperationStruct extends UserOperationStruct {
  advancedUserOperation?: AdvancedUserOperation | undefined;
}

export interface TriggerEvent {
  contractAddress: string;
  eventSignature: string;
  eventLogHash: string;
}
