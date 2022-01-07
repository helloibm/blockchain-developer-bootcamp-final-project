const delay = ms => new Promise(res => setTimeout(res, ms));
App = {
    loading: false,
    contracts: {},
    accounts: [],
    blockchainEndPoint: "https://rinkeby.infura.io/v3/264fc3a9d7ad497bb451317050c5ab51",
    contractAddress: "0xd7306cBaB8Cfe2b9Db05124697803C1F6D36f029",
    
    load: async () => {
        await App.connectMetamaskAndLoad();
    },

    connectMetamaskAndLoad: async () => {
        try {
            App.accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
            }); //connect Metamask
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            const network = await provider.getNetwork();
            const chains = ['', 'main', 'kovan', 'ropsten', 'rinkeby', 'Goerli'];

            window.ethereum.on('chainChanged', (chainId) => {
                // Correctly handling chain changes can be complicated. We recommend reloading the page unless you have good reason not to.
                window.location.reload();
            });

            window.ethereum.on('accountsChanged', (updatedAccounts) => {
                // Handle the new accounts, or lack thereof.
                // "accounts" will always be an array, but it can be empty.
                window.location.reload();
            });

            if (network.chainId !== 4 ) {
                window.alert(
                    "Please connect to rinkeby network on your MetaMask wallet. You are connected to '" +
                    network.name +
                    "'.",
                );
                return;
            }

            await App.loadContract();
        } catch (e) {
            console.log(e);
            window.alert(
            'In order to log in, please install the MetaMask wallet at metamask.io and set it up in your browser.',
            );
            return;
        }
    },

    getContractInstance: async() => {
        const ethersProvider = new ethers.providers.JsonRpcProvider(
            App.blockchainEndPoint,
        );

        var contractJson = await $.getJSON("TweetManager.json");

        const contractAbi = contractJson.abi;
        const contractInstance = new ethers.Contract(
            App.contractAddress,
            contractAbi,
            ethersProvider,
          );
        return contractInstance;
    },
    
    getContractWriter: async() => {
        const ethersProvider = new ethers.providers.Web3Provider(window.ethereum);
        var contractJson = await $.getJSON("TweetManager.json");
        const contractAbi = contractJson.abi;
        const contractContract = new ethers.Contract(
            App.contractAddress,
            contractAbi,
            ethersProvider,
        );
        await window.ethereum.enable(); //connect Metamask
            
        const fromSigner = ethersProvider.getSigner();
        const fromSignerContract = contractContract.connect(fromSigner);
        return fromSignerContract;        
    },

    loadContract: async () => {
        App.tweetManager = await App.getContractInstance();
        console.log('Contract loaded.');
        await App.renderTweets();
    },

    createTweet: async () => {
        try {
            console.log('creating tweet...');
            const overlay = document.getElementById("overlay");
            const success_message = document.getElementById("success");
            overlay.style.display = 'block';
            
            const new_content = document.getElementById("new-tweet").value;
            document.getElementById("new-tweet").value = "";
            
            var contractWriter = await App.getContractWriter();
            await contractWriter.createTweet(new_content);

            const tweetCount = await App.tweetManager.tweetCount();
            const tweet = await App.tweetManager.tweets(tweetCount);
            const ownerAddress = await App.tweetManager.owner();
            const isOwner = App.accounts[0].toLowerCase() == ownerAddress.toLowerCase();

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

            if (App.accounts[0] != user) {
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

            var contractWriter = await App.getContractWriter();
            await contractWriter.likeTweet(parseInt(elem.id));
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

            var contractWriter = await App.getContractWriter();
            await contractWriter.unlikeTweet(parseInt(elem.id));
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

            //await App.loadWeb3();
            var contractWriter = await App.getContractWriter();
            await contractWriter.deleteTweet(parseInt(elem.id));
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

            //await App.loadWeb3();
            var contractWriter = await App.getContractWriter();
            await contractWriter.banUser(user);
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

            //await App.loadWeb3();
            var contractWriter = await App.getContractWriter();
            await contractWriter.unbanUser(user);
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
            const isOwner = App.accounts[0].toLowerCase() == ownerAddress.toLowerCase();

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

                    if (App.accounts[0] != user) {
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
