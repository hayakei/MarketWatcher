
const Web3 = require("web3");
const axios = require("axios");
require("dotenv").config();

// begin variables

const web3 = new Web3(process.env["BSC_RPC"]);
const metaWardenContract = process.env["META_WARDEN_CONTRACT"];
const marketTofuContract = process.env["MARKET_TOFU_CONTRACT"];
const marketNFTrade = process.env["MARKET_NFTRADE_CONTRACT"];
const wbnbContract = process.env["WBNB_CONTRACT"];
const startBlock = Number(process.env["START_BLOCK"]);
const coingeckoURL = "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=USD"
const watchedTopics = {
    "transferWarden": "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "depositBNB": "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c",
    "tofunftRun": "0x5beea7b3b87c573953fec05007114d17712e5775d364acc106d8da9e74849033",
    "nftradeRun": "0x6869791f0a34781b29882982cc39e882768cf2c96995c2a110c577c53bc932d5"
}

// end variables

const getPriceFromCoingecko = async () => {
    return (await axios.get(coingeckoURL))["data"]["binancecoin"]["usd"]
}

(async () => {
    const logs = await web3.eth.getPastLogs({
        fromBlock: startBlock,
        toBlock: startBlock + 4000, // "latest",
        address: metaWardenContract,
        topics: [watchedTopics["transferWarden"]]
    });

    const results = await Promise.all(logs.map(async log => {
        const result = {
            from: "0x",
            to: "0x",
            tokenID: -1,
            amount: 0,
            market: null,
        }
        const txHash = log["transactionHash"];
        const receipt = await web3.eth.getTransactionReceipt(txHash);

        for (let {address, topics, data} of receipt["logs"]) {
            if (address === wbnbContract && topics[0] === watchedTopics["depositBNB"]) {
                result["amount"] = parseInt(data, 16);
            } else if (address === marketTofuContract && topics[0] === watchedTopics["tofunftRun"]) {
                result["market"] = "tofunft";
            } else if (address === marketNFTrade && topics[0] === watchedTopics["nftradeRun"]) {
                result["market"] = "nftrade";
            }
        }

        result["from"] = "0x" + log["topics"][1].slice(-40);
        result["to"] = "0x" + log["topics"][2].slice(-40);
        result["tokenID"] = parseInt(log["topics"][3], 16);

        if (result["market"] === null) {
            console.log(txHash);
        }

        return result
    }));

    console.log(results)

})();
