import { BigNumber, ethers } from "ethers";
import { SafeAbi } from "./SafeAbis";
export interface SafeAdresses {
  fallbackModule: string;
  singleton: string;
  safeProxyFactory: string;
  aaModule: string;
  modulesLib: string;
}
export const addresses: Map<number, SafeAdresses> = new Map<
  number,
  SafeAdresses
>([
  [
    1,
    {
      fallbackModule: "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99",
      singleton: "0x41675C099F32341bf84BFc5382aF534df5C7461a",
      safeProxyFactory: "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
      aaModule: "0xa581c4A4DB7175302464fF3C06380BC3270b4037",
      modulesLib: "",
    },
  ],
  [
    137,
    {
      fallbackModule: "0xfd0732Dc9E303f09fCEf3a7388Ad10A83459Ec99",
      singleton: "0x41675C099F32341bf84BFc5382aF534df5C7461a",
      safeProxyFactory: "0x4e1DCf7AD4e460CfD30791CCC4F9c8a4f820ec67",
      aaModule: "0xa581c4A4DB7175302464fF3C06380BC3270b4037",
      modulesLib: "0x191EFDC03615B575922289DC339F4c70aC5C30Af",
    },
  ],
]);

export const supportedChainIds = () => {
  return Object.keys(addresses);
};
export interface SafeDefultConfig {
  ownerList: Array<string>;
  threshold: BigNumber;
  modulesLib: string;
  modulesList: Array<string>;
  enableModuleEncoding: string;
  fallbackModule: string;
  paymentToken: string;
  payment: BigNumber;
  paymentReceiver: string;
  singleton: string;
}
export const safeDefaultConfig = async (
  owner: string,
  chainId: number
): Promise<SafeDefultConfig> => {
  let safeAddresses = addresses.get(chainId);
  if (safeAddresses === undefined) {
    throw "Unsupported chain Id";
  }
  const safeInterface = new ethers.utils.Interface(SafeAbi);

  const ownerList: Array<string> = new Array<string>();
  ownerList.push(owner);

  const modulesList: Array<string> = new Array<string>();
  modulesList.push(safeAddresses.aaModule);
  const threshold = BigNumber.from(1);
  const modulesLib = ethers.utils.getAddress(safeAddresses.aaModule);
  const enableModuleEncoding = safeInterface.encodeFunctionData(
    "enableModules",
    [modulesList]
  );
  const fallbackModule = ethers.utils.getAddress(safeAddresses.fallbackModule);
  const paymentToken = ethers.constants.AddressZero;
  const payment = BigNumber.from(0);
  const paymentReceiver = ethers.constants.AddressZero;
  return {
    ownerList,
    threshold,
    modulesLib,
    modulesList,
    enableModuleEncoding,
    fallbackModule,
    paymentToken,
    payment,
    paymentReceiver,
    singleton: safeAddresses.singleton,
  };
};
