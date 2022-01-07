const delay = ms => new Promise(res => setTimeout(res, ms));
App = {
    loading: false,
    contracts: {},
    accounts: [],
    load: async () => {
        await App.loadWeb3();
        await App.loadContract();
        await App.renderTweets();
    },

    loadWeb3: async () => {
        if (window.ethereum) {
            window.web3 = new Web3(ethereum);
            try {
                accounts = await ethereum.request({ method: "eth_requestAccounts" });
                web3.eth.defaultAccount = accounts[0];
            }
            catch (error) {
                console.log(error);
            }
        }
        else {
            alert("Non-Ethereum browser detected. You should consider trying MetaMask!");
        }
    },

    loadContract: async () => {
        // Create a JavaScript version of the smart contract
        const tweetManager = await $.getJSON("TweetManager.json");
        App.contracts.TweetManager = TruffleContract(tweetManager);
        App.contracts.TweetManager.setProvider(
            new Web3.providers.HttpProvider("http://127.0.0.1:7545")
        );

        App.tweetManager = await App.contracts.TweetManager.deployed();
        console.log('Contract loaded.');
    },

    createTweet: async () => {
        try {
            console.log('creating tweet...');
            const overlay = document.getElementById("overlay");
            const success_message = document.getElementById("success");
            overlay.style.display = 'block';
            await App.loadWeb3();

            const new_content = document.getElementById("new-tweet").value;
            document.getElementById("new-tweet").value = "";
            await App.tweetManager.createTweet(new_content, { from: web3.eth.defaultAccount });

            const tweetCount = await App.tweetManager.tweetCount();
            const tweet = await App.tweetManager.tweets(tweetCount);
            const ownerAddress = await App.tweetManager.owner();
            const isOwner = web3.eth.defaultAccount == ownerAddress;

            const id = tweet.id.toNumber();
            const content = tweet.content;
            const liked = tweet.liked;
            const user = tweet.user;
            const isUserBanned = await App.tweetManager.isUserBanned(user);

            const tweetTemplate = document.getElementById("tweetTemplate");
            const newTweetTemplate = tweetTemplate.cloneNode(true);
            newTweetTemplate.style.display = "flex";

            newTweetTemplate.children[1].children[0].children[0].innerHTML = `<h3>${user} ${isUserBanned >= 0 ? "(Banned)" : ""}</h3>`;
            newTweetTemplate.children[1].children[0].children[1].innerHTML = content;
            newTweetTemplate.children[1].children[1].children[2].setAttribute("id", id);
            newTweetTemplate.children[1].children[1].children[3].setAttribute("id", id);
            newTweetTemplate.children[1].children[1].children[4].setAttribute("id", id);

            if (web3.eth.defaultAccount != user) {
                //add delete button if its your tweet
                newTweetTemplate.children[1].children[1].children[4].style.display = "none";
            }

            if (isOwner) {
                //add ban and unban button is owner account is logged in
                const banButton = document.createElement("span");
                banButton.className = "material-icons footer";
                banButton.onclick = async function () { App.banUser(user) };
                banButton.style.display = "none";
                banButton.style.cursor = "pointer";
                banButton.innerHTML = "person_off";

                const unbanButton = document.createElement("span");
                unbanButton.className = "material-icons footer";
                unbanButton.onclick = async function () { App.unbanUser(user) };
                unbanButton.style.display = "none";
                unbanButton.style.cursor = "pointer";
                unbanButton.innerHTML = "person_add";

                newTweetTemplate.children[1].children[1].appendChild(banButton);
                newTweetTemplate.children[1].children[1].appendChild(unbanButton);

                if (isUserBanned.toNumber() < 0) {
                    //add ban button
                    if (user != ownerAddress) {
                        newTweetTemplate.children[1].children[1].children[5].style.display = "block";
                        newTweetTemplate.children[1].children[1].children[6].style.display = "none";
                    }

                }
                else {
                    if (user != ownerAddress) {
                        //add unban button
                        newTweetTemplate.children[1].children[1].children[5].style.display = "none";
                        newTweetTemplate.children[1].children[1].children[6].style.display = "block";
                    }
                }
            }

            //like and unlike button
            if (liked) {
                newTweetTemplate.children[1].children[1].children[2].style.display = "none";
                newTweetTemplate.children[1].children[1].children[3].style.display = "block";
            }
            else {
                newTweetTemplate.children[1].children[1].children[2].style.display = "block";
                newTweetTemplate.children[1].children[1].children[3].style.display = "none";
            }

            document
                .getElementById("tweetList")
                .appendChild(newTweetTemplate);

            overlay.style.display = 'none';
            success_message.children[1].innerHTML = `<strong>Success!</strong> Tweet has been successfully created.`
            success_message.style.display = 'block';
        }
        catch (error) {
            console.log(error);
            const error_message = document.getElementById("error");
            error_message.children[1].innerHTML = `${error}`
            overlay.style.display = 'none';
            error_message.style.display = 'block';
        }
    },

    likeTweet: async (elem) => {
        try {
            console.log('liking...');
            elem.style.display = "none";
            elem.parentNode.children[3].style.display = "block";

            await App.tweetManager.likeTweet(parseInt(elem.id), { from: web3.eth.defaultAccount });
            console.log('tweet liked.');
        }
        catch (error) {
            elem.style.display = "block";
            elem.parentNode.children[3].style.display = "none";

            const error_message = document.getElementById("error");
            error_message.children[1].innerHTML = `${error}`
            error_message.style.display = 'block';
        }
    },

    unlikeTweet: async (elem) => {
        try {
            console.log('unliking...');
            elem.style.display = "none";
            elem.parentNode.children[2].style.display = "block";

            await App.tweetManager.unlikeTweet(parseInt(elem.id), { from: web3.eth.defaultAccount });
            console.log('tweet unliked.');
        }
        catch (error) {
            elem.style.display = "block";
            elem.parentNode.children[2].style.display = "none";

            const error_message = document.getElementById("error");
            error_message.children[1].innerHTML = `${error}`
            error_message.style.display = 'block';
        }
    },

    deleteTweet: async (elem) => {
        try {
            console.log('deleting...');
            const overlay = document.getElementById("overlay");
            const success_message = document.getElementById("success");
            overlay.style.display = 'block';

            await App.loadWeb3();
            await App.tweetManager.deleteTweet(parseInt(elem.id), { from: web3.eth.defaultAccount });
            console.log('tweet deleted.');

            overlay.style.display = 'none';
            success_message.children[1].innerHTML = `<strong>Success!</strong> Tweet has been successfully deleted.`
            success_message.style.display = 'block';
            await delay(1000);

            window.location.reload();
        }
        catch (error) {
            const error_message = document.getElementById("error");
            error_message.children[1].innerHTML = `${error}`
            overlay.style.display = 'none';
            error_message.style.display = 'block';
        }
    },

    banUser: async (user) => {
        try {
            console.log("banning...");
            const overlay = document.getElementById("overlay");
            const success_message = document.getElementById("success");
            overlay.style.display = 'block';

            await App.loadWeb3();
            await App.tweetManager.banUser(user, { from: web3.eth.defaultAccount });
            console.log("user has been banned.");

            overlay.style.display = 'none';
            success_message.children[1].innerHTML = `<strong>Success!</strong> User has been banned.`
            success_message.style.display = 'block';
            await delay(1000);

            window.location.reload();
        }
        catch (error) {
            const error_message = document.getElementById("error");
            error_message.children[1].innerHTML = `${error}`
            overlay.style.display = 'none';
            error_message.style.display = 'block';
        }
    },

    unbanUser: async (user) => {
        try {
            console.log("unbanning...");
            const overlay = document.getElementById("overlay");
            const success_message = document.getElementById("success");
            overlay.style.display = 'block';

            await App.loadWeb3();
            await App.tweetManager.unbanUser(user, { from: web3.eth.defaultAccount });
            console.log("user has been unbanned.");

            overlay.style.display = 'none';
            success_message.children[1].innerHTML = `<strong>Success!</strong> User has been banned.`
            success_message.style.display = 'block';
            await delay(1000);

            window.location.reload();
        }
        catch (error) {
            const error_message = document.getElementById("error");
            error_message.children[1].innerHTML = `${error}`
            overlay.style.display = 'none';
            error_message.style.display = 'block';
        }
    },

    renderTweets: async () => {
        try {
            // Will load tweets from the blockchain
            const tweetCount = await App.tweetManager.tweetCount();
            // console.log(tweetCount.toNumber());
            const ownerAddress = await App.tweetManager.owner();
            const isOwner = web3.eth.defaultAccount == ownerAddress;

            for (let i = 1; i <= tweetCount.toNumber(); i++) {
                const tweet = await App.tweetManager.tweets(i);
                if (tweet && tweet.content.length > 0) {
                    const id = tweet.id.toNumber();
                    const content = tweet.content;
                    const liked = tweet.liked;
                    const user = tweet.user;
                    const isUserBanned = await App.tweetManager.isUserBanned(user);

                    const tweetTemplate = document.getElementById("tweetTemplate");
                    const newTweetTemplate = tweetTemplate.cloneNode(true);
                    newTweetTemplate.style.display = "flex";

                    newTweetTemplate.children[1].children[0].children[0].innerHTML = `<h3>${user} ${isUserBanned >= 0 ? "(Banned)" : ""}</h3>`;
                    newTweetTemplate.children[1].children[0].children[1].innerHTML = content;
                    newTweetTemplate.children[1].children[1].children[2].setAttribute("id", id);
                    newTweetTemplate.children[1].children[1].children[3].setAttribute("id", id);
                    newTweetTemplate.children[1].children[1].children[4].setAttribute("id", id);

                    if (web3.eth.defaultAccount != user) {
                        //add delete button if its your tweet
                        newTweetTemplate.children[1].children[1].children[4].style.display = "none";
                    }

                    if (isOwner) {
                        //add ban and unban button is owner account is logged in
                        const banButton = document.createElement("span");
                        banButton.className = "material-icons footer";
                        banButton.onclick = async function () { App.banUser(user) };
                        banButton.style.display = "none";
                        banButton.style.cursor = "pointer";
                        banButton.innerHTML = "person_off";

                        const unbanButton = document.createElement("span");
                        unbanButton.className = "material-icons footer";
                        unbanButton.onclick = async function () { App.unbanUser(user) };
                        unbanButton.style.display = "none";
                        unbanButton.style.cursor = "pointer";
                        unbanButton.innerHTML = "person_add";

                        newTweetTemplate.children[1].children[1].appendChild(banButton);
                        newTweetTemplate.children[1].children[1].appendChild(unbanButton);

                        if (isUserBanned.toNumber() < 0) {
                            //add ban button
                            if (user != ownerAddress) {
                                newTweetTemplate.children[1].children[1].children[5].style.display = "block";
                                newTweetTemplate.children[1].children[1].children[6].style.display = "none";
                            }

                        }
                        else {
                            if (user != ownerAddress) {
                                //add unban button
                                newTweetTemplate.children[1].children[1].children[5].style.display = "none";
                                newTweetTemplate.children[1].children[1].children[6].style.display = "block";
                            }
                        }
                    }

                    //like and unlike button
                    if (liked) {
                        newTweetTemplate.children[1].children[1].children[2].style.display = "none";
                        newTweetTemplate.children[1].children[1].children[3].style.display = "block";
                    }
                    else {
                        newTweetTemplate.children[1].children[1].children[2].style.display = "block";
                        newTweetTemplate.children[1].children[1].children[3].style.display = "none";
                    }

                    document
                        .getElementById("tweetList")
                        .appendChild(newTweetTemplate);
                }
            }
        }
        catch (error) {
            alert(error);
            console.log(error);
        }
    },
};

window.onload = App.load();
