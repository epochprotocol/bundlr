import { UserOperationStruct } from "@account-abstraction/contracts";
import { BigNumberish } from "ethers";

export interface AdvancedUserOperationStruct extends UserOperationStruct {
  advancedUserOperation?: AdvancedUserOperations;
}
export interface AdvancedUserOperations {
  executionTimeWindow?: ExecutionTimeWindow;
  triggerEvent?: TriggerEvent;
  userOpDependency?: UserOpDependency;
}
export interface ExecutionTimeWindow {
  executionWindowStart?: BigNumberish;
  executionWindowEnd?: BigNumberish;
}
export interface TriggerEvent {
  contractAddress?: string;
  eventSignature?: string;
  evaluationStatement?: string;
}
export class UserOpDependency {
  userOpHash!: string;
  bufferTime!: BigNumberish;
}
