

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

interface ExecutionWindow {
    useExecutionWindow: boolean;
    recurring: boolean;
    recurrenceGap: number;
    executionWindowStart: number;
    executionWindowEnd: number;
}
interface IConditionChecker {
    checkCondition(userInput: Uint8Array, onChainCondition: Uint8Array): Promise<boolean>;
}

interface OnChainCondition {
    useOnChainCondition: boolean;
    dataPosition: number;
    dataSource: string;
    conditionChecker: IConditionChecker;
    dataType: DataType;
    encodedQuery: string;
    encodedCondition: string;
}

interface DataSource {
    useDataSource: boolean;
    dataPosition: number;
    positionInCallData: number;
    dataSource: string;
    encodedQuery: string;
}

function isExecutionWindow(arg: ExecutionWindow | OnChainCondition): arg is ExecutionWindow {
    return (arg as ExecutionWindow).useExecutionWindow !== undefined;
}

function isOnChainCondition(arg: ExecutionWindow | OnChainCondition): arg is OnChainCondition {
    return (arg as OnChainCondition).useOnChainCondition !== undefined;
}