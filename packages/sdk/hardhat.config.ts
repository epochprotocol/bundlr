import "@nomiclabs/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";

import { HardhatUserConfig } from "hardhat/config";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.15",
    settings: {
      optimizer: { enabled: true },
    },
  },
  networks: {
    hardhat: {
      chainId: 137,
      forking: {
        url: "https://polygon-mainnet.infura.io/v3/0e4ce57afbd04131b6842f08265b4d4b",
        blockNumber: 51617379,
      },
    },
  },
};

export default config;
