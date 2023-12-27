import { expect } from "chai";
import { ethers, network } from "hardhat";
import { hexValue } from "ethers/lib/utils";
import { SafeAccountApi } from "../src/SafeAccountApi";
import { Wallet } from "ethers";
import {
  EntryPoint,
  EntryPoint__factory,
} from "@account-abstraction/contracts";
import {
  SampleRecipient,
  SampleRecipient__factory,
} from "@epoch-protocol/utils";
import { DeterministicDeployer } from "../src/DeterministicDeployer";
import { EthersAdapter } from "@safe-global/protocol-kit";
const provider = ethers.provider;
const signer = provider.getSigner();
describe("#SafeWalletApi", () => {
  let owner: Wallet;
  let api: SafeAccountApi;
  let entryPoint: EntryPoint;
  let beneficiary: string;
  let recipient: SampleRecipient;
  let accountAddress: string;
  let accountDeployed = false;
  before("init", async () => {
    // await network.provider.request({
    //   method: "hardhat_reset",
    //   params: [
    //     {
    //       forking: {
    //         jsonRpcUrl:
    //           "https://polygon-mainnet.infura.io/v3/311ef590f7e5472a90edfa1316248cff",
    //         blockNumber: 14768690,
    //       },
    //     },
    //   ],
    // });
    entryPoint = await new EntryPoint__factory(signer).deploy();
    beneficiary = await signer.getAddress();

    recipient = await new SampleRecipient__factory(signer).deploy();
    owner = Wallet.createRandom();
    owner = owner.connect(provider);
    DeterministicDeployer.init(ethers.provider);
    api = new SafeAccountApi({
      provider: owner.provider,
      entryPointAddress: entryPoint.address,
      owner,
      salt: "1",
    });
  });
  it("Should return counterfactual address", async () => {
    let counterfactual = await api.getCounterFactualAddress();
    console.log(counterfactual);
  });
});
