require("dotenv").config();

module.exports = {
    walletPrivateKey: process.env.WALLET_PRIVATE_KEY,
    walletAddress: process.env.WALLET_ADDRESS, // The 1st holder is the admin owner
    
    blockchainEndpoints: {
        infuraRinkebyUrl: process.env.INFURA_RINKEBY_URL,
        infuraRopstenUrl: process.env.INFURA_ROPSTEN_URL,
    },
};
