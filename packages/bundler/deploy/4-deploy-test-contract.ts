import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";
import { DeterministicDeployer } from "@account-abstraction/sdk";
import { EntryPoint__factory } from "@account-abstraction/contracts";
import { TestCounter__factory } from "../src/types";

const deployTestContract: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment,
) {
  const dep = new DeterministicDeployer(ethers.provider);
  await dep.deterministicDeploy(TestCounter__factory.bytecode);

  const CounterAddr = DeterministicDeployer.getAddress(
    TestCounter__factory.bytecode,
  );
  console.log("CounterAddr: ", CounterAddr);
};

export default deployTestContract;
