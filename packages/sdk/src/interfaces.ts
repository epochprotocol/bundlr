import { IEpochRegistry } from "@epoch-protocol/accountabstraction/typechain";

enum DataType {
    STRING,
    STRING_STATIC_ARRAY,
    STRING_DYNAMIC_ARRAY,
    ADDRESS,
    ADDRESS_STATIC_ARRAY,
    ADDRESS_DYNAMIC_ARRAY,
    UINT,
    UINT_STATIC_ARRAY,
    UINT_DYNAMIC_ARRAY,
    BYTES,
    BYTES_STATIC_ARRAY,
    BYTES_DYNAMIC_ARRAY,
    BOOL,
    BOOL_STATIC_ARRAY,
    BOOL_DYNAMIC_ARRAY
}

interface ExecutionWindow extends IEpochRegistry.ExecutionWindowStruct {
}


interface OnChainCondition extends IEpochRegistry.OnChainConditionStruct {

}

interface DataSource extends IEpochRegistry.DataSourceStruct {
}

function isExecutionWindow(arg: ExecutionWindow | OnChainCondition): arg is ExecutionWindow {
    return (arg as ExecutionWindow).useExecutionWindow !== undefined;
}

function isOnChainCondition(arg: ExecutionWindow | OnChainCondition): arg is OnChainCondition {
    return (arg as OnChainCondition).useOnChainCondition !== undefined;
}

export { DataSource, DataType, ExecutionWindow, OnChainCondition, isExecutionWindow, isOnChainCondition };
