const PrivateKeyProvider = require("@truffle/hdwallet-provider");
const secrets = require("./secrets");

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      provider: () =>
        new PrivateKeyProvider({
          privateKeys: [secrets.walletPrivateKey],
          providerOrUrl: secrets.blockchainEndpoints.infuraRinkebyUrl,
        }),
      gasPrice: 20000000000,
      network_id: 4, // Rinkeby's id
      gas: 8500000, // Rinkeby has a lower block limit than mainnet
      // confirmations: 2, // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200, // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: false, // Skip dry run before migrations? (default: false for public nets )
      networkCheckTimeout: 90000,
    },
    ropsten: {
      provider: () =>
        new PrivateKeyProvider({
          privateKeys: [secrets.walletPrivateKey],
          providerOrUrl: secrets.blockchainEndpoints.infuraRopstenUrl,
        }),
      network_id: 3,
      gas: 8000000, // CBDC uses about 5M gas, block limit is 8M
      gasPrice: 3000000000, // triple current gas price in order to mine quicker
    },
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  },
  compilers: {
    solc: {
      version: "^0.8.0"
    }
  }
}