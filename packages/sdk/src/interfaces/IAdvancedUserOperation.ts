import { UserOperationStruct } from "@account-abstraction/contracts";
import { BigNumberish } from "ethers/lib/ethers";

export interface AdvancedUserOperationStruct extends UserOperationStruct {
    advancedUserOperation?: AdvancedUserOperation | undefined;
}

export interface AdvancedUserOperation {
    executionWindowStart?: BigNumberish;
    executionWindowEnd?: BigNumberish;
    readyForExecution?: boolean | undefined;
}