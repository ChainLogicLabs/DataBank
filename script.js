// Initialize Web3.js with the provided version
let web3;

// Check if MetaMask is installed
if (window.ethereum) {
    web3 = new Web3(window.ethereum);
} else {
    // If MetaMask is not installed, prompt the user to install it
    console.error("MetaMask not detected. Please install MetaMask.");
}

// Replace with your contract address
const contractAddress = "0x730b7312e0D00A94495FB9f46Bb7E1287119686f";
const contractABI = [{"inputs":[],"stateMutability":"nonpayable","type":"constructor"},
{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"}],"name":"AddressBlocked","type":"event"},
{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"}],"name":"AddressUnblocked","type":"event"},
{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"user","type":"address"},{"indexed":true,"internalType":"bytes32","name":"salt","type":"bytes32"},{"indexed":false,"internalType":"string","name":"originalData","type":"string"},{"indexed":false,"internalType":"bytes32","name":"hashedData","type":"bytes32"},{"indexed":false,"internalType":"bytes32","name":"newRoot","type":"bytes32"}],"name":"DataStored","type":"event"},
{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"previousOwner","type":"address"},{"indexed":true,"internalType":"address","name":"newOwner","type":"address"}],"name":"OwnershipTransferred","type":"event"},
{"inputs":[{"internalType":"address[]","name":"_userAddresses","type":"address[]"},{"internalType":"string[]","name":"_originalData","type":"string[]"},{"internalType":"bytes32[]","name":"_salts","type":"bytes32[]"},{"internalType":"bytes32","name":"_batchId","type":"bytes32"}],"name":"_storeBatchDataWithSalts","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"address","name":"_userAddress","type":"address"},{"internalType":"string","name":"_originalData","type":"string"},{"internalType":"bytes32","name":"_salt","type":"bytes32"},{"internalType":"bytes32","name":"_batchId","type":"bytes32"}],"name":"_storeDataWithSalt","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"blockAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[],"name":"contractDisabled","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"emergencyKill","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"address","name":"oracleAddress","type":"address"},{"internalType":"string","name":"asset","type":"string"}],"name":"getPriceFromOracle","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},
{"inputs":[],"name":"owner","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},
{"inputs":[{"internalType":"bytes32","name":"_batchId","type":"bytes32"}],"name":"retrieveBatchUsers","outputs":[{"internalType":"address[]","name":"","type":"address[]"}],"stateMutability":"view","type":"function"},
{"inputs":[{"internalType":"address","name":"_userAddress","type":"address"},{"internalType":"bytes32","name":"_salt","type":"bytes32"}],"name":"retrieveHashedDataWithSalt","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},
{"inputs":[{"internalType":"address","name":"_userAddress","type":"address"},{"internalType":"bytes32","name":"_salt","type":"bytes32"}],"name":"retrieveOriginalDataWithSalt","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},
{"inputs":[{"internalType":"address","name":"newOwner","type":"address"}],"name":"transferOwnership","outputs":[],"stateMutability":"nonpayable","type":"function"},
{"inputs":[{"internalType":"address","name":"user","type":"address"}],"name":"unblockAddress","outputs":[],"stateMutability":"nonpayable","type":"function"}]; // Replace with your contract ABI

// Create a contract instance
const dataBankContract = new web3.eth.Contract(contractABI, contractAddress);

// Function to handle MetaMask login
async function loginWithMetaMask() {
    try {
        // Request account access if needed
        await window.ethereum.enable();
        // Get the selected account
        const accounts = await web3.eth.getAccounts();
        const selectedAccount = accounts[0];
        console.log("Logged in with MetaMask. Selected Account:", selectedAccount);
        // Set the default account
        web3.eth.defaultAccount = selectedAccount;
    } catch (error) {
        console.error("Error logging in with MetaMask:", error);
    }
}

// Function to convert string to bytes32
function stringToBytes32(inputString) {
    return web3.utils.asciiToHex(inputString);
}

// Function to convert address to bytes32
function addressToBytes32(inputAddress) {
    return web3.utils.padLeft(inputAddress, 64);
}

// Function to store data
async function storeData() {
    const userAddress = document.getElementById("userAddress").value;
    const originalData = document.getElementById("originalData").value;
    const salt = document.getElementById("salt").value;
    const batchId = document.getElementById("batchId").value;

    const saltBytes32 = stringToBytes32(salt); // Convert salt to bytes32
    const batchIdBytes32 = stringToBytes32(batchId); // Convert batchId to bytes32

    try {
        // Check if default account is set
        if (!web3.eth.defaultAccount) {
            throw new Error("No default account set. Please log in with MetaMask.");
        }

        await dataBankContract.methods._storeDataWithSalt(userAddress, originalData, saltBytes32, batchIdBytes32)
            .send({ from: web3.eth.defaultAccount });

        console.log("Data stored successfully.");
    } catch (error) {
        console.error("Error storing data:", error);
    }
}

// Function to store batch data
async function storeBatchData() {
    const batchUserAddresses = document.getElementById("batchUserAddresses").value.split(',');
    const batchOriginalData = document.getElementById("batchOriginalData").value.split(',');
    const batchSalts = document.getElementById("batchSalts").value.split(',');
    const batchIdBatch = document.getElementById("batchIdBatch").value;

    const batchSaltsBytes32 = batchSalts.map(stringToBytes32); // Convert batch salts to bytes32
    const batchIdBatchBytes32 = stringToBytes32(batchIdBatch); // Convert batchId to bytes32

    try {
        if (web3.eth.defaultAccount) {
            await dataBankContract.methods._storeBatchDataWithSalts(batchUserAddresses, batchOriginalData, batchSaltsBytes32, batchIdBatchBytes32)
                .send({ from: web3.eth.defaultAccount });
            console.log("Batch data stored successfully.");
        } else {
            console.error("No MetaMask account found. Please log in first.");
        }
    } catch (error) {
        console.error("Error storing batch data:", error);
    }
}

// Function to retrieve original data
async function retrieveOriginalData() {
    const retrieveUserAddress = document.getElementById("retrieveUserAddress").value;
    const retrieveSalt = document.getElementById("retrieveSalt").value;

    console.log("Retrieving Original Data. User Address:", retrieveUserAddress, "Salt:", retrieveSalt);

    const retrieveSaltBytes32 = stringToBytes32(retrieveSalt);

    try {
        const result = await dataBankContract.methods.retrieveOriginalDataWithSalt(retrieveUserAddress, retrieveSaltBytes32).call();
        console.log("Retrieved Original Data:", result);
        displayResult("Retrieved Original Data: " + result);
    } catch (error) {
        console.error("Error retrieving original data:", error);
        displayResult("Error retrieving original data: " + error.message);
    }
}

// Function to retrieve hashed data
async function retrieveHashedData() {
    const retrieveUserAddress = document.getElementById("retrieveUserAddress").value;
    const retrieveSalt = document.getElementById("retrieveSalt").value;

    const retrieveSaltBytes32 = stringToBytes32(retrieveSalt);

    try {
        const result = await dataBankContract.methods.retrieveHashedDataWithSalt(retrieveUserAddress, retrieveSaltBytes32).call();
        displayResult("Retrieved Hashed Data: " + result);
    } catch (error) {
        console.error("Error retrieving hashed data:", error);
        displayResult("Error retrieving hashed data: " + error.message);
    }
}

// Function to retrieve batch users
async function retrieveBatchUsers() {
    const retrieveBatchId = document.getElementById("retrieveBatchId").value;

    const retrieveBatchIdBytes32 = stringToBytes32(retrieveBatchId);

    try {
        const result = await dataBankContract.methods.retrieveBatchUsers(retrieveBatchIdBytes32).call();
        displayResult("Retrieved Batch Users: " + result.join(', '));
    } catch (error) {
        console.error("Error retrieving batch users:", error);
        displayResult("Error retrieving batch users: " + error.message);
    }
}

// Function to display the result on the HTML page
function displayResult(result) {
    const resultContainer = document.getElementById("resultContainer");
    resultContainer.innerText = result;
}

// Function to get price from Oracle
async function getPriceFromOracle() {
    const oracleAddress = document.getElementById("oracleAddress").value;
    const asset = document.getElementById("asset").value;

    console.log("Getting price from Oracle. Oracle Address:", oracleAddress, "Asset:", asset);

    try {
        const result = await dataBankContract.methods.getPriceFromOracle(oracleAddress, asset).call();
        console.log("Price from Oracle:", result);
        displayResults("Price from Oracle: " + result);
    } catch (error) {
        console.error("Error getting price from Oracle:", error);
        displayResults("Error getting price from Oracle: " + error.message);
    }
}

// Function to display the result on the HTML page
function displayResults(result) {
    const resultContainer = document.getElementById("resultsContainer");
    resultContainer.innerText = result;
}