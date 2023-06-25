import { AdvancedUserOperationStruct } from "./IAdvancedUserOperation";

export interface IAdvancedMempoolEntry {
    chainId: number;
    userOp: AdvancedUserOperationStruct;
    entryPoint: string;
    aggregator?: string;
    lastUpdatedTime: number;
    hash?: string;
}