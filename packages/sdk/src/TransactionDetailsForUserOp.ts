import { BigNumberish } from 'ethers'
import { AdvancedUserOperation } from './interfaces/IAdvancedUserOperation'

export interface TransactionDetailsForUserOp {
  target: string
  data: string
  value?: BigNumberish
  gasLimit?: BigNumberish
  maxFeePerGas?: BigNumberish
  maxPriorityFeePerGas?: BigNumberish
  nonce?: BigNumberish
}
export interface TransactionDetailsForAdvancedUserOp extends TransactionDetailsForUserOp {
  advancedUserOperation?: AdvancedUserOperation
}
