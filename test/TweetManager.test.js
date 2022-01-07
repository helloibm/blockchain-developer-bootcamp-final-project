const TweetManager = artifacts.require("./TweetManager.sol");
let { catchRevert } = require("./exceptionsHelpers.js");

contract("TweetManager", (accounts) => {
  before(async () => {
    this.tweetManager = await TweetManager.deployed();
  });

  it("deploys successfully", async () => {
    const address = await this.tweetManager.address;
    assert.notEqual(address, 0x0);
    assert.notEqual(address, "");
    assert.notEqual(address, null);
    assert.notEqual(address, undefined);
  });

  it("creates a tweet", async () => {
    await this.tweetManager.createTweet("New Tweet", {from: accounts[0]});
    const tweetCount = await this.tweetManager.tweetCount();
    assert.equal(tweetCount.toNumber(), 1);
  });

  it("likes a tweet that is not made by the user themselves", async () => {
    await this.tweetManager.createTweet("New Tweet 2", {from: accounts[1]});
    const tweetCount = await this.tweetManager.tweetCount();
    await this.tweetManager.likeTweet(tweetCount, {from: accounts[0]});
    const tweet = await this.tweetManager.tweets(tweetCount);
    assert.equal(tweet.liked, true);
  });

  it("does not like a tweet that is made by the user themselves", async () => {
    await this.tweetManager.createTweet("New Tweet 3", {from: accounts[0]});
    const tweetCount = await this.tweetManager.tweetCount();
    await catchRevert(this.tweetManager.likeTweet(tweetCount, {from: accounts[0]}));
  });

  it("unlikes a tweet", async () => {
    await this.tweetManager.createTweet("New Tweet 4", {from: accounts[1]});
    const tweetCount = await this.tweetManager.tweetCount();
    await this.tweetManager.likeTweet(tweetCount, {from: accounts[0]});
    await this.tweetManager.unlikeTweet(tweetCount, {from: accounts[0]});
    const tweet = await this.tweetManager.tweets(tweetCount);
    assert.equal(tweet.liked, false);
  });

  it("ban a user if you are the owner", async() => {
    await this.tweetManager.banUser(accounts[1], {from: accounts[0]});
    await catchRevert(this.tweetManager.createTweet("lets see", {from: accounts[1]}));
  });

  it("cannot ban a user he has already been banned", async() => {
    await catchRevert(this.tweetManager.banUser(accounts[1], {from: accounts[0]}));
  });

  it("unban a user if you are the owner", async() => {
    await this.tweetManager.banUser(accounts[2], {from: accounts[0]});
    await this.tweetManager.unbanUser(accounts[2], {from: accounts[0]});

    const tweetCountOld = await this.tweetManager.tweetCount();
    await this.tweetManager.createTweet(("lets see"), {from: accounts[2]});
    const tweetCountNew = await this.tweetManager.tweetCount();

    assert.equal(tweetCountOld.toNumber() + 1, tweetCountNew.toNumber());
  });

  it("cannot ban a user if you are not the owner", async() => {
    await catchRevert(this.tweetManager.banUser(accounts[2], {from: accounts[1]}));
  });

  it("cannot unban a user if you are not the owner", async() => {
    this.tweetManager.banUser(accounts[5], {from: accounts[0]})
    await catchRevert(this.tweetManager.unbanUser(accounts[5], {from: accounts[1]}));
  });

  it("can delete your own tweet", async() => {
    await this.tweetManager.createTweet("New Tweet 5", {from: accounts[3]});
    const tweetCount = await this.tweetManager.tweetCount();
    await this.tweetManager.deleteTweet(tweetCount, {from: accounts[3]});
  });

  it("cannot delete tweet made by a different user", async() => {
    await this.tweetManager.createTweet("New Tweet 6", {from: accounts[2]});
    const tweetCount = await this.tweetManager.tweetCount();
    await catchRevert(this.tweetManager.deleteTweet(tweetCount, {from: accounts[1]}));
  });
});
