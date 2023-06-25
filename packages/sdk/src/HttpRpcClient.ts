import { JsonRpcProvider } from '@ethersproject/providers'
import { ethers } from 'ethers'
import { resolveProperties } from 'ethers/lib/utils'
import { UserOperationStruct } from '@account-abstraction/contracts'
import Debug from 'debug'
import { deepHexlify } from '@account-abstraction/utils'
import { AdvancedUserOperation, AdvancedUserOperationStruct } from './interfaces/IAdvancedUserOperation'
import { IAdvancedMempoolEntry } from './interfaces/IAdvancedMempoolEntry'

const debug = Debug('aa.rpc')

export class HttpRpcClient {
  private readonly userOpJsonRpcProvider: JsonRpcProvider

  initializing: Promise<void>

  constructor(
    readonly bundlerUrl: string,
    readonly entryPointAddress: string,
    readonly chainId: number
  ) {
    this.userOpJsonRpcProvider = new ethers.providers.JsonRpcProvider(this.bundlerUrl, {
      name: 'Connected bundler network',
      chainId
    })
    this.initializing = this.validateChainId()
  }

  async validateChainId(): Promise<void> {
    // validate chainId is in sync with expected chainid
    const chain = await this.userOpJsonRpcProvider.send('eth_chainId', [])
    const bundlerChain = parseInt(chain)
    if (bundlerChain !== this.chainId) {
      throw new Error(`bundler ${this.bundlerUrl} is on chainId ${bundlerChain}, but provider is on chainId ${this.chainId}`)
    }
  }

  /**
   * send a UserOperation to the bundler
   * @param userOp1
   * @return userOpHash the id of this operation, for getUserOperationTransaction
   */
  async sendUserOpToBundler(userOp1: AdvancedUserOperationStruct): Promise<string> {
    await this.initializing
    const hexifiedUserOp = deepHexlify(await resolveProperties(userOp1))
    const jsonRequestData: [UserOperationStruct, string] = [hexifiedUserOp, this.entryPointAddress]
    await this.printUserOperation('eth_sendUserOperation', jsonRequestData)
    const trx = await this.userOpJsonRpcProvider
      .send('eth_sendUserOperation', [hexifiedUserOp, this.entryPointAddress])
    console.log(trx);
    return trx;
  }

  /**
   * send a UserOperation to the bundler
   * @param address
   * @return returns useroperations in advanced operations mempool
   */
  async getUserOperations(address: string): Promise<Array<IAdvancedMempoolEntry>> {
    const mempoolEntry: Array<IAdvancedMempoolEntry> = await this.userOpJsonRpcProvider
      .send('eth_getUserOperations', [address])
    console.log(mempoolEntry);
    return mempoolEntry;
  }

  /**
   * estimate gas requirements for UserOperation
   * @todo change verificationGas to verificationGasLimit when the tests in the bundler are changed
   * @param userOp1
   * @returns latest gas suggestions made by the bundler.
   */
  async estimateUserOpGas(userOp1: Partial<UserOperationStruct>): Promise<{ callGasLimit: number, preVerificationGas: number, verificationGas: number }> {
    await this.initializing
    const hexifiedUserOp = deepHexlify(await resolveProperties(userOp1))
    const jsonRequestData: [UserOperationStruct, string] = [hexifiedUserOp, this.entryPointAddress]
    await this.printUserOperation('eth_estimateUserOperationGas', jsonRequestData)
    return await this.userOpJsonRpcProvider
      .send('eth_estimateUserOperationGas', [hexifiedUserOp, this.entryPointAddress])
  }

  private async printUserOperation(method: string, [userOp1, entryPointAddress]: [UserOperationStruct, string]): Promise<void> {
    const userOp = await resolveProperties(userOp1)
    debug('sending', method, {
      ...userOp
      // initCode: (userOp.initCode ?? '').length,
      // callData: (userOp.callData ?? '').length
    }, entryPointAddress)
  }
}
