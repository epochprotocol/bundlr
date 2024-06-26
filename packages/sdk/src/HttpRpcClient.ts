import { UserOperationStruct } from "@account-abstraction/contracts";
import { JsonRpcProvider } from "@ethersproject/providers";
import { ethers } from "ethers";
import { resolveProperties } from "ethers/lib/utils";

import {
  NotPromise,
  deepHexlify,
  getUserOpHashWithoutNonce,
} from "@epoch-protocol/utils";
import Debug from "debug";

import { AdvancedUserOperationStruct } from "./AdvancedUserOp";

const debug = Debug("aa.rpc");
export interface AdvancedUserOperationListStruct {
  chainId: string;
  userOp: UserOperationStruct;
}
export class HttpRpcClient {
  private readonly userOpJsonRpcProvider: JsonRpcProvider;

  initializing: Promise<void>;

  constructor(
    readonly bundlerUrl: string,
    readonly entryPointAddress: string,
    readonly chainId: number
  ) {
    this.userOpJsonRpcProvider = new ethers.providers.JsonRpcProvider({
      url: this.bundlerUrl,
      skipFetchSetup: true,
    });
    this.initializing = this.validateChainId();
  }

  async validateChainId(): Promise<void> {
    // validate chainId is in sync with expected chainid
    const chain = await this.userOpJsonRpcProvider.send("eth_chainId", []);
    const bundlerChain = parseInt(chain);
    if (bundlerChain !== this.chainId) {
      throw new Error(
        `bundler ${this.bundlerUrl} is on chainId ${bundlerChain}, but provider is on chainId ${this.chainId}`
      );
    }
  }

  /**
   * send a UserOperation to the bundler
   * @param userOp
   * @return userOpHash the id of this operation, for getUserOperationTransaction
   */
  async sendUserOpToBundler(
    userOp: AdvancedUserOperationStruct
  ): Promise<string> {
    await this.initializing;
    const hexifiedUserOp = deepHexlify(await resolveProperties(userOp));
    const jsonRequestData: [UserOperationStruct, string] = [
      hexifiedUserOp,
      this.entryPointAddress,
    ];
    await this.printUserOperation("eth_sendUserOperation", jsonRequestData);
    return await this.userOpJsonRpcProvider.send("eth_sendUserOperation", [
      hexifiedUserOp,
      this.entryPointAddress,
    ]);
  }

  /**
   * delete a UserOperation from bundler
   * @param userOp
   * @return userOpHash the id of this operation, for getUserOperationTransaction
   */
  async deleteAdvancedUserOpFromBundler(
    userOp: AdvancedUserOperationStruct
  ): Promise<string> {
    await this.initializing;
    const hexifiedUserOp = deepHexlify(await resolveProperties(userOp));
    const jsonRequestData: [UserOperationStruct, string] = [
      hexifiedUserOp,
      this.entryPointAddress,
    ];
    await this.printUserOperation("eth_deleteUserOperation", jsonRequestData);
    return await this.userOpJsonRpcProvider.send("eth_deleteUserOperation", [
      hexifiedUserOp,
      this.entryPointAddress,
    ]);
  }
  /**
   * get userOperations for a user.
   * @param sender
   * @return sender - address of smart contract wallet.
   */
  async getAdvancedUserOperations(
    sender: string
  ): Promise<Array<AdvancedUserOperationListStruct>> {
    await this.initializing;
    const resp: Array<AdvancedUserOperationListStruct> =
      await this.userOpJsonRpcProvider.send("eth_getUserOperations", [sender]);
    return resp;
  }

  /**
   * send a UserOperation to the bundler
   * @param userOp1
   * @return userOpHash the id of this operation, for getUserOperationTransaction
   */
  async getValidNonceKey(
    userOp: NotPromise<UserOperationStruct>
  ): Promise<string> {
    const address = userOp.sender;
    const userOpHash = getUserOpHashWithoutNonce(
      userOp,
      this.entryPointAddress,
      this.chainId
    );
    await this.initializing;
    return await this.userOpJsonRpcProvider.send("eth_getValidNonceKey", [
      address,
      userOpHash,
    ]);
  }

  /**
   * estimate gas requirements for UserOperation
   * @param userOp1
   * @returns latest gas suggestions made by the bundler.
   */
  async estimateUserOpGas(userOp1: Partial<UserOperationStruct>): Promise<{
    callGasLimit: number;
    preVerificationGas: number;
    verificationGasLimit: number;
  }> {
    await this.initializing;
    const hexifiedUserOp = deepHexlify(await resolveProperties(userOp1));
    const jsonRequestData: [UserOperationStruct, string] = [
      hexifiedUserOp,
      this.entryPointAddress,
    ];
    await this.printUserOperation(
      "eth_estimateUserOperationGas",
      jsonRequestData
    );
    return await this.userOpJsonRpcProvider.send(
      "eth_estimateUserOperationGas",
      [hexifiedUserOp, this.entryPointAddress]
    );
  }

  private async printUserOperation(
    method: string,
    [userOp1, entryPointAddress]: [UserOperationStruct, string]
  ): Promise<void> {
    const userOp = await resolveProperties(userOp1);
    debug(
      "sending",
      method,
      {
        ...userOp,
        // initCode: (userOp.initCode ?? '').length,
        // callData: (userOp.callData ?? '').length
      },
      entryPointAddress
    );
  }
}
