import { ethers } from "ethers";

export interface Approval {
  tokenAddress: string; // address in Solidity translates to string in TypeScript
  spenderAddress: string;
  amount: string; // uint256 in Solidity translates to string for precision handling in TypeScript
  chainId: number; // Assuming chainId is uint8 or similar
}

interface Constraint {
  constraintData: string; // bytes translates to a hex string in TypeScript
  constraintResponse: string;
  constraints: string; // string remains string
}

interface Constraint {
  constraintData: string; // bytes translates to a hex string in TypeScript
  constraintResponse: string;
  constraints: string; // string remains string
}

interface IntentParams {
  approvals: Approval[];
  task: string;
  nonce: string; // uint256 represented as string
  optimizationFactor: string; // uint256 represented as string
  constraint: Constraint;
  deadline: string; // uint256 represented as string
  triggers: string;
  proposedFeeRewards: string; // uint256 represented as string
  preferredSolvers: string[]; // Array of addresses
  recurring: boolean;
  chainIds: number[]; // Array of uint8
  calldatas: Calldata[];
}

interface Intent extends IntentParams {
  completed: boolean;
  executor: string; // Address of executor
}

interface Calldata {
  target: string; // address in Solidity translates to string in TypeScript
  value: string; // uint256 is represented as string for precision handling
  data: string; // bytes translates to a hex string
}

export function getIntentEIP191Hash(intent: IntentParams): string {
  // Create ABI coder instance
  const abiCoder = new ethers.utils.AbiCoder();

  // Encode each nested struct/array first
  const encodedApprovals = intent.approvals.map((approval) => [
    approval.tokenAddress,
    approval.spenderAddress,
    approval.amount,
    approval.chainId,
  ]);

  const encodedConstraint = [
    intent.constraint.constraintData,
    intent.constraint.constraintResponse,
    intent.constraint.constraints,
  ];

  const encodedCalldatas = intent.calldatas.map((calldata) => [
    calldata.target,
    calldata.value,
    calldata.data,
  ]);

  // Encode the full intent struct
  const encodedIntent = abiCoder.encode(
    [
      "tuple(tuple(address tokenAddress, address spenderAddress, uint256 amount, uint8 chainId)[] approvals," +
        "bytes task," +
        "uint256 nonce," +
        "uint256 optimizationFactor," +
        "tuple(bytes constraintData, string constraintResponse, string constraints) constraint," +
        "uint256 deadline," +
        "string triggers," +
        "uint256 proposedFeeRewards," +
        "address[] preferredSolvers," +
        "bool recurring," +
        "uint8[] chainIds," +
        "tuple(address target, uint256 value, bytes data)[] calldatas)",
    ],
    [
      [
        encodedApprovals,
        intent.task,
        intent.nonce,
        intent.optimizationFactor,
        encodedConstraint,
        intent.deadline,
        intent.triggers,
        intent.proposedFeeRewards,
        intent.preferredSolvers,
        intent.recurring,
        intent.chainIds,
        encodedCalldatas,
      ],
    ]
  );

  // Get the EIP-191 prefixed hash
  const messageHashBytes = ethers.utils.arrayify(encodedIntent);
  const messageHash = ethers.utils.hashMessage(messageHashBytes);

  return messageHash;
}
/**
 * Signs an intent using EIP-191 personal message signing
 * @param intent The intent to sign
 * @param signer The signer to use
 * @returns The signature
 */
export async function signIntent(
  intent: Intent,
  signer: ethers.Signer
): Promise<string> {
  // Get the message hash
  const messageHash = getIntentEIP191Hash(intent);

  // Sign the hash using personal_sign (EIP-191)
  const signature = await signer.signMessage(
    ethers.utils.arrayify(messageHash)
  );

  return signature;
}
