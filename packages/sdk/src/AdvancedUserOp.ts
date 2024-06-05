import { UserOperationStruct } from "@account-abstraction/contracts";
import { BigNumberish } from "ethers";

export interface AdvancedUserOperationStruct extends UserOperationStruct {
  advancedUserOperation?: AdvancedUserOperations;
}
export class AdvancedUserOperations {
  executionTimeWindow?: ExecutionTimeWindow;
  triggerEvent?: TriggerEvent;
  userOpDependency?: UserOpDependency;
}
export class ExecutionTimeWindow {
  executionWindowStart?: BigNumberish;
  executionWindowEnd?: BigNumberish;
}
export class TriggerEvent {
  contractAddress?: string;
  eventSignature?: string;
  evaluationStatement?: string;
}
export class UserOpDependency {
  userOpHash!: string;
  bufferTime!: BigNumberish;
}
