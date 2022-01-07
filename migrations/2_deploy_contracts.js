const TweetManager = artifacts.require("./TweetManager.sol");

module.exports = function(deployer) {
  deployer.deploy(TweetManager);
};
