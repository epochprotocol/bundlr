import { expect } from "chai";
import { SampleRecipient__factory } from "@epoch-protocol/utils";
import { ethers, network } from "hardhat";
import { hexValue } from "ethers/lib/utils";
import { DeterministicDeployer } from "../src/DeterministicDeployer";

const deployer = new DeterministicDeployer(ethers.provider);

describe("#deterministicDeployer", () => {
  before(async () => {
    await network.provider.request({
      method: "hardhat_reset",
    });
  });
  it("deploy deployer", async () => {
    console.log("checking if deployed");

    expect(await deployer.isDeployerDeployed()).to.equal(false);
    console.log("Not deployed");
    await deployer.deployFactory();
    expect(await deployer.isDeployerDeployed()).to.equal(true);
  });
  it("should ignore deploy again of deployer", async () => {
    await deployer.deployFactory();
  });
  it("should deploy at given address", async () => {
    const ctr = hexValue(
      new SampleRecipient__factory(
        ethers.provider.getSigner()
      ).getDeployTransaction().data!
    );
    DeterministicDeployer.init(ethers.provider);
    const addr = await DeterministicDeployer.getAddress(ctr);
    expect(await deployer.isContractDeployed(addr)).to.equal(false);
    await DeterministicDeployer.deploy(ctr);
    expect(await deployer.isContractDeployed(addr)).to.equal(true);
  });
});
