//SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
import "./Ownable.sol";
import "./ITweetManager.sol";

/// @title Tweet Manager Contract
/// @dev Implementation of the {ITweetManager} interface

contract TweetManager is ITweetManager, Ownable {
    uint public tweetCount = 0;

    ///@param id The tweet id
    ///@param user The address of the user who created the tweet
    ///@param content The content of the tweet
    ///@param liked The liked status of the tweet
    struct Tweet {
        uint id;
        address user;
        string content;
        bool liked;
    }

    mapping(uint => Tweet) public tweets;
    mapping(address => uint[]) public userTweetIds;
    address[] bannedUsers;

    ///@dev This event is emitted when a user is banned
    ///@param userAddress The address of the user
    event UserBanned(address indexed userAddress);

    ///@dev This event is emitted when a user is unbanned
    ///@param userAddress The address of the user
    event UserUnbanned(address indexed userAddress);

    constructor() {}

    ///@dev Create a Tweet object and stores it in the tweets mapping
    ///@param _content The content of the tweet
    ///@return A boolean that tells if the operation was a success
    function createTweet(string memory _content)
        public
        override
        returns (bool)
    {
        require(
            isUserBanned(msg.sender) < 0,
            "You are banned and cannot send tweets"
        );
        require(bytes(_content).length > 0, "Tweet cannot be empty");
        require(
            bytes(_content).length < 280,
            "Tweet must be less than 280 characters"
        );
        tweetCount++;
        tweets[tweetCount] = Tweet(tweetCount, msg.sender, _content, false);
        userTweetIds[msg.sender].push(tweetCount);
        emit TweetCreated(msg.sender, _content);

        return true;
    }

    ///@dev Delete a tweet from the tweets mapping
    ///@param id The id of the tweet
    ///@return A boolean that tells if the operation was a success
    function deleteTweet(uint id) public override returns (bool) {
        require(
            msg.sender == tweets[id].user,
            "You can only delete your own tweets"
        );

        //delete tweet id from userTweetIds
        address user = tweets[id].user;
        uint[] memory userTweets = userTweetIds[user];
        for (uint i = 0; i < userTweets.length; i++) {
            if (userTweets[i] == id) {
                //copy last element into current spot and then pop last element
                userTweetIds[user][i] = userTweetIds[user][
                    userTweets.length - 1
                ];
                userTweetIds[user].pop();
            }
        }

        emit TweetDeleted(tweets[id].user, tweets[id].content);

        tweets[id].content = "";
        tweets[id].liked = false;
        tweets[id].user = address(0);
        tweets[id].id = 0;

        return true;
    }

    ///@dev Like a tweet
    ///@param id The id of the tweet
    ///@return A boolean that tells if the operation was a success
    function likeTweet(uint id) public override returns (bool) {
        if (msg.sender == tweets[id].user) {
            revert("You cannot like your own tweet");
        }
        tweets[id].liked = true;
        return true;
    }

    ///@dev Unlike a tweet
    ///@param id The id of the tweet
    ///@return A boolean that tells if the operation was a success
    function unlikeTweet(uint id) public override returns (bool) {
        tweets[id].liked = false;
        return true;
    }

    ///@dev Get all the ids of the tweets a user has made.
    ///@param user The address of the user
    ///@return A uint array of tweet ids
    function getTweetsByUser(address user)
        public
        view
        returns (uint[] memory)
    {
        return userTweetIds[user];
    }

    ///@dev Ban a user
    ///@param user The address of the user
    function banUser(address user) public onlyOwner {
        require(msg.sender != user, "You cannot ban yourself");
        require(user != address(0), "Invalid address");
        int256 userIndex = isUserBanned(user);
        require(userIndex < 0, "User is already banned");
        bannedUsers.push(user);
        emit UserBanned(user);
    }

    ///@dev Unban a user
    ///@param user The address of the user
    function unbanUser(address user) public onlyOwner {
        require(user != address(0), "Invalid address");
        int256 userIndex = isUserBanned(user);
        require(userIndex >= 0, "Cannot unban a user who was not banned");
        bannedUsers[uint(userIndex)] = bannedUsers[bannedUsers.length - 1];
        bannedUsers.pop();
        emit UserUnbanned(user);
    }

    ///@dev Check if a user is banned
    ///@param user The address of the user
    ///@return An int that has a value greater than -1 if the user is banned 
    function isUserBanned(address user) public view returns (int) {
        int index = -1;
        for (uint i = 0; i < bannedUsers.length; i++) {
            if (bannedUsers[i] == user) {
                index = int(i);
                break;
            }
        }
        return index;
    }
}
