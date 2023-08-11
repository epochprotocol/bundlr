import {
  SimpleAccount,
  SimpleAccountFactory,
  SimpleAccountFactory__factory,
  SimpleAccount__factory,
} from "@account-abstraction/contracts";
import { BigNumber, BigNumberish } from "ethers";

import { Signer } from "@ethersproject/abstract-signer";
import { arrayify, hexConcat } from "ethers/lib/utils";
import { BaseAccountAPI, BaseApiParams } from "./BaseAccountAPI";
import { TransactionDetailsForAdvancedUserOp } from "./TransactionDetailsForUserOp";
import { AdvancedUserOperationStruct } from "./interfaces/IAdvancedUserOperation";

/**
 * constructor params, added no top of base params:
 * @param owner the signer object for the account owner
 * @param factoryAddress address of contract "factory" to deploy new contracts (not needed if account already deployed)
 * @param index nonce value used when creating multiple accounts for the same owner
 */
export interface SimpleAccountApiParams extends BaseApiParams {
  owner: Signer;
  factoryAddress?: string;
  index?: BigNumberish;
}

/**
 * An implementation of the BaseAccountAPI using the SimpleAccount contract.
 * - contract deployer gets "entrypoint", "owner" addresses and "index" nonce
 * - owner signs requests using normal "Ethereum Signed Message" (ether's signer.signMessage())
 * - nonce method is "nonce()"
 * - execute method is "execFromEntryPoint()"
 */
export class SimpleAccountAPI extends BaseAccountAPI {
  factoryAddress?: string;
  owner: Signer;
  index: BigNumberish;

  /**
   * our account contract.
   * should support the "execFromEntryPoint" and "nonce" methods
   */
  accountContract?: SimpleAccount;

  factory?: SimpleAccountFactory;

  constructor(params: SimpleAccountApiParams) {
    super(params);
    this.factoryAddress = params.factoryAddress;
    this.owner = params.owner;
    this.index = BigNumber.from(params.index ?? 0);
  }

  async _getAccountContract(): Promise<SimpleAccount> {
    if (this.accountContract == null) {
      this.accountContract = SimpleAccount__factory.connect(
        await this.getAccountAddress(),
        this.provider,
      );
    }
    return this.accountContract;
  }

  /**
   * return the value to put into the "initCode" field, if the account is not yet deployed.
   * this value holds the "factory" address, followed by this account's information
   */
  async getAccountInitCode(): Promise<string> {
    if (this.factory == null) {
      if (this.factoryAddress != null && this.factoryAddress !== "") {
        this.factory = SimpleAccountFactory__factory.connect(
          this.factoryAddress,
          this.provider,
        );
      } else {
        throw new Error("no factory to get initCode");
      }
    }
    return hexConcat([
      this.factory.address,
      this.factory.interface.encodeFunctionData("createAccount", [
        await this.owner.getAddress(),
        this.index,
      ]),
    ]);
  }

  async getNonce(): Promise<BigNumber> {
    if (await this.checkAccountPhantom()) {
      return BigNumber.from(0);
    }
    const accountContract = await this._getAccountContract();
    return await accountContract.getNonce();
  }


  /**
    * encode a method call from entryPoint to our contract
    * @param destination
    * @param isBatchTransaction
    * @param executionWindowCondition
    * @param onChainCondition
    * @param dataSource
    * @param targets
    */
  async addTask(
    destination: string,
    isBatchTransaction: boolean,
    executionWindowCondition: ExecutionWindow,
    onChainCondition: OnChainCondition,
    dataSource: DataSource,
    targets: string[],
  ): Promise<BigNumberish> {
    const accountContract = await this._getAccountContract();
    return accountContract.interface.encodeFunctionData("addTask", [
      destination,
      isBatchTransaction,
      executionWindowCondition,
      onChainCondition,
      dataSource,
      targets,
    ]);
  }

  /**
   * encode a method call from entryPoint to our contract
   * @param target
   * @param value
   * @param data
   */
  async encodeExecute(
    target: string,
    value: BigNumberish,
    data: string,
  ): Promise<string> {
    const accountContract = await this._getAccountContract();
    return accountContract.interface.encodeFunctionData("execute", [
      target,
      value,
      data,
    ]);
  }

  /**
    * encode a method call from entryPoint to our contract
    * @param taskId
    * @param target
    * @param value
    * @param data
    */
  async encodeExecuteEpoch(
    taskId: BigNumberish,
    target: string,
    value: BigNumberish,
    data: string,
  ): Promise<string> {
    const accountContract = await this._getAccountContract();
    return accountContract.interface.encodeFunctionData("executeEpoch", [
      taskId,
      target,
      value,
      data,
    ]);
  }

  /**
   * encode a batch method call from entryPoint to our contract
   * @param targets
   * @param datas
   */
  async encodeExecuteBatch(
    targets: string[],
    datas: string[]
  ): Promise<string> {
    const accountContract = await this._getAccountContract();
    return accountContract.interface.encodeFunctionData("executeBatch", [
      targets,
      datas,
    ]);
  }
  /**
   * encode a method call from entryPoint to our contract
   * @param taskId
   * @param target
   * @param values
   * @param data
   */
  async encodeExecuteBatchEpoch(
    taskId: BigNumberish,
    target: string[],
    values: BigNumberish[],
    data: string[],
  ): Promise<string> {
    const accountContract = await this._getAccountContract();
    return accountContract.interface.encodeFunctionData("executeBatchEpoch", [
      taskId,
      target,
      values,
      data,
    ]);
  }

  /**
   * helper method: create and sign a user operation.
   * @param info transaction details for the userOp
   */
  async createSignedBatchUserOp(
    infos: Array<TransactionDetailsForAdvancedUserOp>, nonce: BigNumberish
  ): Promise<AdvancedUserOperationStruct> {
    const userWallet = await this.getAccountAddress();
    const batchTxDetail: TransactionDetailsForAdvancedUserOp = {
      target: userWallet,
      data: "",
      value: BigNumber.from(0),
      gasLimit: BigNumber.from(0),
      maxFeePerGas: BigNumber.from(0),
      maxPriorityFeePerGas: BigNumber.from(0),
      nonce: nonce,
      advancedUserOperation: infos[0].advancedUserOperation,
    };

    const datas: string[] = [];
    const values: BigNumberish[] = [];
    const targets: string[] = [];

    let { maxFeePerGas, maxPriorityFeePerGas } = batchTxDetail;
    if (maxFeePerGas == null || maxPriorityFeePerGas == null) {
      const feeData = await this.provider.getFeeData();
      if (maxFeePerGas == null) {
        maxFeePerGas = feeData.maxFeePerGas ?? undefined;
      }
      if (maxPriorityFeePerGas == null) {
        maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? undefined;
      }
    }

    infos.forEach((info) => {
      datas.push(info.data);
      info.value ? values.push(info.value) : BigNumber.from(0);
      targets.push(info.target);

      if (info.gasLimit) {
        batchTxDetail.gasLimit = BigNumber.from(batchTxDetail.gasLimit).add(
          BigNumber.from(info.gasLimit)
        );
      }
      batchTxDetail.maxFeePerGas = maxFeePerGas
      batchTxDetail.maxPriorityFeePerGas = maxPriorityFeePerGas
    });

    const accountContract = await this._getAccountContract();
    const data = accountContract.interface.encodeFunctionData("executeBatch", [
      targets,
      datas,
    ]);

    batchTxDetail.data = data;

    return await this.signUserOp(
      await this.createUnsignedBatchUserOp(batchTxDetail)
    );
  }

  /**
   * helper method: create and sign a epoch user operation.
   * @param info transaction details for the userOp
   * @param value 
   * @param condition 
   * @param dataSource 
   */
  async createSignedEpochUserOp(
    info: TransactionDetailsForAdvancedUserOp,
    value: BigNumberish,
    condition?: ExecutionWindow | OnChainCondition,
    dataSource?: DataSource,
  ): Promise<AdvancedUserOperationStruct> {
    const userWallet = await this.getAccountAddress();
    const txDetails: TransactionDetailsForAdvancedUserOp = {
      target: userWallet,
      data: "",
      value: value,
      gasLimit: BigNumber.from(0),
      maxFeePerGas: BigNumber.from(0),
      maxPriorityFeePerGas: BigNumber.from(0),
      advancedUserOperation: info.advancedUserOperation,
    };


    let { maxFeePerGas, maxPriorityFeePerGas } = txDetails;
    if (maxFeePerGas == null || maxPriorityFeePerGas == null) {
      const feeData = await this.provider.getFeeData();
      if (maxFeePerGas == null) {
        maxFeePerGas = feeData.maxFeePerGas ?? undefined;
      }
      if (maxPriorityFeePerGas == null) {
        maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? undefined;
      }
    }


    var demoOnChainCondition: OnChainCondition;
    const demoFunc: IConditionChecker = {
      async checkCondition(userInput: Uint8Array, onChainCondition: Uint8Array): Promise<boolean> {
        return true;
      }
    };
    demoOnChainCondition = {
      useOnChainCondition: false,
      dataPosition: 0,
      dataSource: "",
      conditionChecker: demoFunc,
      dataType: DataType.STRING,
      encodedQuery: "",
      encodedCondition: "",
    }

    var demoExecutionWindowCondition: ExecutionWindow;
    demoExecutionWindowCondition = {
      useExecutionWindow: false,
      recurring: false,
      recurrenceGap: 0,
      executionWindowStart: 0,
      executionWindowEnd: 0,
    }

    const demoDataSource: DataSource = {
      useDataSource: false,
      dataPosition: 0,
      positionInCallData: 0,
      dataSource: "",
      encodedQuery: "",
    }
    dataSource = dataSource ?? demoDataSource;

    var taskId: BigNumberish;
    const targets: string[] = [];

    if (condition && isExecutionWindow(condition)) {
      taskId = await this.addTask(info.target, true, condition, demoOnChainCondition, dataSource, targets);
    } else if (condition && isOnChainCondition(condition)) {
      taskId = await this.addTask(info.target, true, demoExecutionWindowCondition, condition, dataSource, targets);
    } else {
      taskId = await this.addTask(info.target, true, demoExecutionWindowCondition, demoOnChainCondition, dataSource, targets);
    }

    const data = await this.encodeExecuteEpoch(taskId, info.target, value, info.data);

    txDetails.data = data;

    return await this.signUserOp(
      await this.createUnsignedEpochUserOp(txDetails)
    );
  }

  /**
   * helper method: create and sign a batch epoch user operation.
   * @param info transaction details for the userOp
   * @param condition 
   * @param dataSource 
   */
  async createSignedEpochBatchUserOp(
    infos: Array<TransactionDetailsForAdvancedUserOp>,
    condition?: ExecutionWindow | OnChainCondition,
    dataSource?: DataSource,
  ): Promise<AdvancedUserOperationStruct> {
    const userWallet = await this.getAccountAddress();
    const batchTxDetail: TransactionDetailsForAdvancedUserOp = {
      target: userWallet,
      data: "",
      value: BigNumber.from(0),
      gasLimit: BigNumber.from(0),
      maxFeePerGas: BigNumber.from(0),
      maxPriorityFeePerGas: BigNumber.from(0),
      advancedUserOperation: infos[0].advancedUserOperation,
    };

    const datas: string[] = [];
    const values: BigNumberish[] = [];
    const targets: string[] = [];

    let { maxFeePerGas, maxPriorityFeePerGas } = batchTxDetail;
    if (maxFeePerGas == null || maxPriorityFeePerGas == null) {
      const feeData = await this.provider.getFeeData();
      if (maxFeePerGas == null) {
        maxFeePerGas = feeData.maxFeePerGas ?? undefined;
      }
      if (maxPriorityFeePerGas == null) {
        maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? undefined;
      }
    }

    infos.forEach((info) => {
      datas.push(info.data);
      info.value ? values.push(info.value) : BigNumber.from(0);
      targets.push(info.target);

      if (info.gasLimit) {
        batchTxDetail.gasLimit = BigNumber.from(batchTxDetail.gasLimit).add(
          BigNumber.from(info.gasLimit)
        );
      }
      batchTxDetail.maxFeePerGas = maxFeePerGas
      batchTxDetail.maxPriorityFeePerGas = maxPriorityFeePerGas
    });

    var demoOnChainCondition: OnChainCondition;
    const demoFunc: IConditionChecker = {
      async checkCondition(userInput: Uint8Array, onChainCondition: Uint8Array): Promise<boolean> {
        return true;
      }
    };
    demoOnChainCondition = {
      useOnChainCondition: false,
      dataPosition: 0,
      dataSource: "",
      conditionChecker: demoFunc,
      dataType: DataType.STRING,
      encodedQuery: "",
      encodedCondition: "",
    }

    var demoExecutionWindowCondition: ExecutionWindow;
    demoExecutionWindowCondition = {
      useExecutionWindow: false,
      recurring: false,
      recurrenceGap: 0,
      executionWindowStart: 0,
      executionWindowEnd: 0,
    }

    const demoDataSource: DataSource = {
      useDataSource: false,
      dataPosition: 0,
      positionInCallData: 0,
      dataSource: "",
      encodedQuery: "",
    }
    dataSource = dataSource ?? demoDataSource;

    var taskId: BigNumberish;

    if (condition && isExecutionWindow(condition)) {
      taskId = await this.addTask("", true, condition, demoOnChainCondition, dataSource, targets);
    } else if (condition && isOnChainCondition(condition)) {
      taskId = await this.addTask("", true, demoExecutionWindowCondition, condition, dataSource, targets);
    } else {
      taskId = await this.addTask("", true, demoExecutionWindowCondition, demoOnChainCondition, dataSource, targets);
    }

    const data = await this.encodeExecuteBatchEpoch(taskId, targets, values, datas);


    batchTxDetail.data = data;
    batchTxDetail.value = values.reduce((acc, value) => {
      return BigNumber.from(acc).add(BigNumber.from(value));
    }, BigNumber.from(0));

    return await this.signUserOp(
      await this.createUnsignedEpochUserOp(batchTxDetail)
    );
  }

  async signUserOpHash(userOpHash: string): Promise<string> {
    return await this.owner.signMessage(arrayify(userOpHash));
  }

  /**
   * create a UserOperation, filling all details (except signature)
   * - if account is not yet created, add initCode to deploy it.
   * - if gas or nonce are missing, read them from the chain (note that we can't fill gaslimit before the account is created)
   * @param info
   */
  async createUnsignedEpochUserOp(
    info: TransactionDetailsForAdvancedUserOp,
  ): Promise<AdvancedUserOperationStruct> {
    const { callData, callGasLimit } =
      await this.encodeUserOpCallDataAndGasLimit(info);
    const initCode = await this.getInitCode();

    const initGas = await this.estimateCreationGas(initCode);
    const verificationGasLimit = BigNumber.from(
      await this.getVerificationGasLimit(),
    ).add(initGas);

    let { maxFeePerGas, maxPriorityFeePerGas } = info;
    if (maxFeePerGas == null || maxPriorityFeePerGas == null) {
      const feeData = await this.provider.getFeeData();
      if (maxFeePerGas == null) {
        maxFeePerGas = feeData.maxFeePerGas ?? undefined;
      }
      if (maxPriorityFeePerGas == null) {
        maxPriorityFeePerGas = feeData.maxPriorityFeePerGas ?? undefined;
      }
    }

    const partialUserOp: any = {
      sender: this.getAccountAddress(),
      initCode,
      callData: info.data,
      callGasLimit,
      verificationGasLimit,
      maxFeePerGas,
      maxPriorityFeePerGas,
      paymasterAndData: "0x",
      advancedUserOperation: info.advancedUserOperation,
    };

    let paymasterAndData: string | undefined;
    if (this.paymasterAPI != null) {
      // fill (partial) preVerificationGas (all except the cost of the generated paymasterAndData)
      const userOpForPm = {
        ...partialUserOp,
        preVerificationGas: await this.getPreVerificationGas(partialUserOp),
      };
      paymasterAndData = await this.paymasterAPI.getPaymasterAndData(
        userOpForPm,
      );
    }
    partialUserOp.paymasterAndData = paymasterAndData ?? "0x";
    return {
      ...partialUserOp,
      preVerificationGas: this.getPreVerificationGas(partialUserOp),
      signature: "",
    };
  }
}
