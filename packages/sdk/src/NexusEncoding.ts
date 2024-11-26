import { BytesLike, ethers } from "ethers";
import { concat, defaultAbiCoder, hexlify } from "ethers/lib/utils";

export interface Execution {
  target: string;
  value: bigint;
  callData: BytesLike;
}

/**
 * Encodes a single execution call for Nexus wallet
 * @param target Address to call
 * @param value Amount of ETH to send
 * @param callData Encoded function call data
 * @returns Encoded execution data
 */
export function encodeSingle(
  target: string,
  value: bigint,
  callData: BytesLike
): string {
  return ethers.utils.solidityPack(
    ["address", "uint256", "calldata"],
    [target, value, callData]
  );
}

/**
 * Encodes a delegate call for Nexus wallet
 * @param delegate Address of contract to delegate call to
 * @param callData Encoded function call data
 * @returns Encoded delegate call data
 */
export function encodeDelegateCall(
  delegate: string,
  callData: BytesLike
): string {
  // Convert delegate to 20 bytes, concatenate with calldata
  const delegateBytes = hexlify(delegate).slice(2).padStart(40, "0");
  const callDataHex = hexlify(callData).slice(2);

  return "0x" + delegateBytes + callDataHex;
}

/**
 * Encodes a batch of executions for Nexus wallet
 * @param executions Array of executions to batch
 * @returns Encoded batch execution data
 */
export function encodeBatch(executions: Execution[]): string {
  // Encode array of Execution structs according to ERC7579
  return defaultAbiCoder.encode(
    ["tuple(address target, uint256 value, bytes callData)[]"],
    [executions]
  );
}

/**
 * Constants for execution mode encoding
 */
export const ExecutionMode = {
  // Call types
  CALLTYPE_SINGLE: "0x00",
  CALLTYPE_BATCH: "0x01",
  CALLTYPE_STATIC: "0xFE",
  CALLTYPE_DELEGATECALL: "0xFF",

  // Exec types
  EXECTYPE_DEFAULT: "0x00",
  EXECTYPE_TRY: "0x01",

  // Mode selector
  MODE_DEFAULT: "0x00000000",
} as const;

/**
 * Encodes execution mode and calldata for Nexus wallet execute function
 * @param mode ExecutionMode bytes32 value containing calltype, exectype, etc
 * @param executionCalldata Encoded execution data
 * @returns Encoded function call data
 */
export function encodeExecute(
  mode: BytesLike,
  executionCalldata: BytesLike
): string {
  // Encode according to function signature:
  // execute(ExecutionMode mode, bytes calldata executionCalldata)
  return defaultAbiCoder.encode(
    ["bytes32", "bytes"],
    [mode, executionCalldata]
  );
}

/**
 * Creates bytes32 execution mode for simple single call
 * @returns Encoded execution mode
 */
export function getSimpleSingleMode(): string {
  return hexlify(
    concat([
      ExecutionMode.CALLTYPE_SINGLE,
      ExecutionMode.EXECTYPE_DEFAULT,
      "0x00000000", // unused
      ExecutionMode.MODE_DEFAULT,
      "0x0000000000000000000000000000000000000000000000", // payload
    ])
  );
}

/**
 * Creates bytes32 execution mode for simple batch call
 * @returns Encoded execution mode
 */
export function getSimpleBatchMode(): string {
  return hexlify(
    concat([
      ExecutionMode.CALLTYPE_BATCH,
      ExecutionMode.EXECTYPE_DEFAULT,
      "0x00000000", // unused
      ExecutionMode.MODE_DEFAULT,
      "0x0000000000000000000000000000000000000000000000", // payload
    ])
  );
}

/**
 * Creates bytes32 execution mode for try-single call
 * @returns Encoded execution mode
 */
export function getTrySingleMode(): string {
  return hexlify(
    concat([
      ExecutionMode.CALLTYPE_SINGLE,
      ExecutionMode.EXECTYPE_TRY,
      "0x00000000", // unused
      ExecutionMode.MODE_DEFAULT,
      "0x0000000000000000000000000000000000000000000000", // payload
    ])
  );
}

/**
 * Creates bytes32 execution mode for try-batch call
 * @returns Encoded execution mode
 */
export function getTryBatchMode(): string {
  return hexlify(
    concat([
      ExecutionMode.CALLTYPE_BATCH,
      ExecutionMode.EXECTYPE_TRY,
      "0x00000000", // unused
      ExecutionMode.MODE_DEFAULT,
      "0x0000000000000000000000000000000000000000000000", // payload
    ])
  );
}

/**
 * Creates bytes32 execution mode with custom parameters
 * @param callType Call type byte
 * @param execType Execution type byte
 * @param modeSelector Mode selector bytes4 (optional)
 * @param payload Mode payload bytes22 (optional)
 * @returns Encoded execution mode
 */
export function getCustomMode(
  callType: string,
  execType: string,
  modeSelector: string = ExecutionMode.MODE_DEFAULT,
  payload: string = "0x0000000000000000000000000000000000000000000000"
): string {
  return hexlify(
    concat([
      callType,
      execType,
      "0x00000000", // unused
      modeSelector,
      payload,
    ])
  );
}
