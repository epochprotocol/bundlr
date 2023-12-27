import { BigNumber, BigNumberish, Signer, ethers } from "ethers";
import { BaseAccountAPI, BaseApiParams } from "./BaseAccountAPI";
import Safe, {
  SafeFactory,
  EthersAdapter,
  SafeAccountConfig,
  ConnectSafeConfig,
} from "@safe-global/protocol-kit";
import { Safe4337Module, SafeAbi, SafeProxyFactoryAbi } from "./SafeAbis";
import { safeDefaultConfig } from "./SafeConstants";
import {
  EntryPoint,
  EntryPoint__factory,
} from "@account-abstraction/contracts";
import { arrayify } from "ethers/lib/utils";
export interface SafeAccountParams extends BaseApiParams {
  owner: Signer;
  factoryAddress?: string;
  index?: BigNumberish;
  salt?: string;
}
export class SafeAccountApi extends BaseAccountAPI {
  ethAdapter: EthersAdapter;

  owner: Signer;

  safeFactory: SafeFactory | undefined;

  salt?: string;

  entrypointContract?: EntryPoint;

  safe?: Safe;

  constructor(params: SafeAccountParams) {
    super(params);
    const ethAdapter = new EthersAdapter({
      ethers,
      signerOrProvider: params.owner,
    });
    this.owner = params.owner;
    this.ethAdapter = ethAdapter;
    this.salt = params.salt;
  }
  async getAccountInitCode(): Promise<string> {
    const promises = Promise.all([
      this.owner.getAddress(),
      this.owner.getChainId(),
    ]);
    const [owner, chainId] = await promises;
    const _safeDefaultConfig = await safeDefaultConfig(owner, chainId);

    const safeInterface = new ethers.utils.Interface(SafeAbi);

    const initParams = safeInterface.encodeFunctionData("setup", [
      _safeDefaultConfig.ownerList,
      _safeDefaultConfig.threshold,
      _safeDefaultConfig.modulesLib,
      _safeDefaultConfig.enableModuleEncoding,
      _safeDefaultConfig.fallbackModule,
      _safeDefaultConfig.paymentToken,
      _safeDefaultConfig.payment,
      _safeDefaultConfig.paymentReceiver,
    ]);
    const safeProxyFactoryInterface = new ethers.utils.Interface(
      SafeProxyFactoryAbi
    );

    let initCode = safeProxyFactoryInterface.encodeFunctionData(
      "createProxyWithNonce",
      [_safeDefaultConfig.singleton, this.salt, initParams]
    );
    return initCode;
  }
  async getNonce(key?: string): Promise<BigNumber> {
    if (await this.checkAccountPhantom()) {
      return BigNumber.from(0);
    }
    const accountAddress = await this.getCounterFactualAddress();

    if (key) {
      const entrypoint = await this._getEntrypointContract();
      if (entrypoint) {
        return entrypoint.getNonce(accountAddress, key);
      }
    }
    let safe = new Safe();
    let connectSafeConfig: ConnectSafeConfig = {
      ethAdapter: this.ethAdapter,
      safeAddress: await this.getCounterFactualAddress(),
    };
    safe.connect(connectSafeConfig);
    return BigNumber.from(await safe.getNonce());
  }
  async getCounterFactualAddress(): Promise<string> {
    let safeFactory = await this._getSafeFactory();
    let defaultConfig = await safeDefaultConfig(
      await this.owner.getAddress(),
      await this.owner.getChainId()
    );
    let safeAccountConfig: SafeAccountConfig = {
      owners: defaultConfig.ownerList,
      threshold: defaultConfig.threshold.toNumber(),
      data: defaultConfig.enableModuleEncoding,
      fallbackHandler: defaultConfig.fallbackModule,
      paymentToken: defaultConfig.paymentToken,
      payment: defaultConfig.payment.toNumber(),
      paymentReceiver: defaultConfig.paymentReceiver,
    };

    return await safeFactory.predictSafeAddress(safeAccountConfig, this.salt);
  }
  async encodeExecute(
    target: string,
    value: BigNumberish,
    data: string
  ): Promise<string> {
    const safe4337Module = new ethers.utils.Interface(Safe4337Module);

    return safe4337Module.encodeFunctionData("executeUserOp", [
      target,
      value,
      data,
      BigNumber.from("0"),
    ]);
  }
  async signUserOpHash(userOpHash: string): Promise<string> {
    return await this.owner.signMessage(arrayify(userOpHash));
  }
  async _getSafeFactory() {
    if (this.safeFactory) {
      return this.safeFactory;
    } else {
      const _safeFactory = await SafeFactory.create({
        ethAdapter: this.ethAdapter,
      });
      this.safeFactory = _safeFactory;
      return this.safeFactory;
    }
  }
  async _getEntrypointContract(): Promise<EntryPoint | undefined> {
    if (
      this.entrypointContract == null &&
      this.entryPointAddress &&
      this.entryPointAddress !== ""
    ) {
      this.entrypointContract = EntryPoint__factory.connect(
        this.entryPointAddress,
        this.provider
      );
    }
    return this.entrypointContract;
  }

  async _getSafe(): Promise<Safe | undefined> {
    if (this.safe == null) {
      let safe = new Safe();
      let connectSafeConfig: ConnectSafeConfig = {
        ethAdapter: this.ethAdapter,
        safeAddress: await this.getCounterFactualAddress(),
      };
      safe.connect(connectSafeConfig);
    }
    return this.safe;
  }
}
