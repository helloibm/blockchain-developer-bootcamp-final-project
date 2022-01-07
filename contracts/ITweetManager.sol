//SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

///@title Tweet Manager Interface
///@dev Implement this to create a basic tweet manager

interface ITweetManager {
    ///@dev This event is emitted when a tweet is created
    ///@param userAddress The address of the user
    ///@param content The content of the tweet
    event TweetCreated(address indexed userAddress, string content);

    ///@dev This event is emitted when a tweet is deleted
    ///@param userAddress The address of the user
    ///@param content The content of the tweet
    event TweetDeleted(address indexed userAddress, string content);

    ///@dev Create a Tweet object and stores it in the tweets mapping
    ///@param _content The content of the tweet
    ///@return A boolean that tells if the operation was a success
    function createTweet(string memory _content) external returns (bool);

    ///@dev Delete a tweet from the tweets mapping
    ///@param id The id of the tweet
    ///@return A boolean that tells if the operation was a success
    function deleteTweet(uint256 id) external returns (bool);

    ///@dev Like a tweet
    ///@param id The id of the tweet
    ///@return A boolean that tells if the operation was a success
    function likeTweet(uint256 id) external returns (bool);

    ///@dev Unlike a tweet
    ///@param id The id of the tweet
    ///@return A boolean that tells if the operation was a success
    function unlikeTweet(uint256 id) external returns (bool);
}
