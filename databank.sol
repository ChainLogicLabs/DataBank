// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

// Pricing Oracle Interface
interface PricingOracle {
    function getPrice(string memory asset) external view returns (uint256);
}

// This contract allows users to input single or batch data strings with a custom salt
// All data entries are hashed and stored on the Merkle tree
contract DataBank {

    address public owner; // Owner of the contract

    mapping(address => address) private ownershipHistory; // Track the owners of this contract
    mapping(address => bool) private blacklistedAddresses; // Track blacklisted addresses

    bool private _locked; // Non-reentry status
    bool public contractDisabled; // Show if contract is disabled

    struct PrivacyStorage {
        bytes32 root;
        mapping(address => mapping(bytes32 => string)) userDataBySalt;
        mapping(address => mapping(bytes32 => bytes32)) hashedDataBySalt;
        mapping(bytes32 => address[]) batches;
    }

    PrivacyStorage private privacyStorage;

    event DataStored(address indexed user, bytes32 indexed salt, string originalData, bytes32 hashedData, bytes32 newRoot);
    event AddressBlocked(address indexed user); // Event when address is blocked
    event AddressUnblocked(address indexed user); // Event when address is unblocked
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner); // Event when ownership is transferred

    // Only the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    // Non-reentrant modifier
    modifier nonReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    // Modifier to check if address is not blacklisted
    modifier notBlacklisted() {
        require(!blacklistedAddresses[msg.sender], "You are blacklisted and cannot perform this action");
        _;
    }

    // Modifier to require contract is not disable
    modifier notDisabled() {
        require(!contractDisabled, "Contract is disabled");
        _;
    }

    // Constructor sets the contract owner
    constructor() {
        owner = msg.sender; // The one who deploys the contract
    }

    // Function to store data with a salt
    function _storeDataWithSalt(address _userAddress, string memory _originalData, bytes32 _salt, bytes32 _batchId) public onlyOwner notDisabled {
        require(bytes(_originalData).length > 0, "Data must not be empty");

        // Calculate hash of the original data combined with the salt
        bytes32 hashedData = keccak256(abi.encodePacked(_originalData, _salt));

        // Store original data and hashed data in user-specific mappings
        privacyStorage.userDataBySalt[_userAddress][_salt] = _originalData;
        privacyStorage.hashedDataBySalt[_userAddress][_salt] = hashedData;

        // Update Merkle tree root with the new hashed data
        bytes32[] memory proof = new bytes32[](1); // For simplicity, just using a single leaf node as an example
        proof[0] = hashedData; // Set leaf node as the hashed data
        privacyStorage.root = computeRoot(proof); // Recalculate Merkle root with the new leaf node

        // Store the user address in the batch mapping
        privacyStorage.batches[_batchId].push(_userAddress);

        // Emit event for data storage
        emit DataStored(_userAddress, _salt, _originalData, hashedData, privacyStorage.root);
    }

    // Function to store batch data with salts
    function _storeBatchDataWithSalts(address[] memory _userAddresses, string[] memory _originalData, bytes32[] memory _salts, bytes32 _batchId) public onlyOwner notDisabled {
        require(_userAddresses.length == _originalData.length && _userAddresses.length == _salts.length, "Invalid input lengths");

        for (uint256 i = 0; i < _userAddresses.length; i++) {
            _storeDataWithSalt(_userAddresses[i], _originalData[i], _salts[i], _batchId);
        }
    }

    // Function to compute the Merkle tree root
    function computeRoot(bytes32[] memory _proof) internal pure returns (bytes32) {
        uint256 len = _proof.length;
        require(len > 0, "No data to compute root");

        bytes32 node = _proof[0];
        for (uint256 i = 1; i < len; i++) {
            node = keccak256(abi.encodePacked(node, _proof[i]));
        }
        return node;
    }

    // Function to get asset prices from oracles
    function getPriceFromOracle(address oracleAddress, string memory asset) external view notBlacklisted notDisabled returns (uint256) {
        PricingOracle oracle = PricingOracle(oracleAddress);
        return oracle.getPrice(asset);
    }

    // Function to retrieve original data with salt
    function retrieveOriginalDataWithSalt(address _userAddress, bytes32 _salt) external view notBlacklisted notDisabled returns (string memory) {
        return privacyStorage.userDataBySalt[_userAddress][_salt];
    }

    // Function to retrieve hashed data with salt
    function retrieveHashedDataWithSalt(address _userAddress, bytes32 _salt) external view notBlacklisted notDisabled returns (bytes32) {
        return privacyStorage.hashedDataBySalt[_userAddress][_salt];
    }

    // Function to retrieve batch users
    function retrieveBatchUsers(bytes32 _batchId) external view notBlacklisted notDisabled returns (address[] memory) {
        return privacyStorage.batches[_batchId];
    }

    // Function to block or blacklist an address
    function blockAddress(address user) external onlyOwner nonReentrant notBlacklisted notDisabled {
        require(user != address(0), "Invalid user address");
        require(!blacklistedAddresses[user], "Address is already blacklisted");
        blacklistedAddresses[user] = true;
        emit AddressBlocked(user);
    }

    // Function to unblock an address
    function unblockAddress(address user) external onlyOwner nonReentrant notBlacklisted notDisabled {
        require(user != address(0), "Invalid user address");
        require(blacklistedAddresses[user], "Address is not blacklisted");
        blacklistedAddresses[user] = false;
        emit AddressUnblocked(user);
    }

    // Function to transfer ownership
    function transferOwnership(address newOwner) external onlyOwner nonReentrant notBlacklisted notDisabled {
        require(newOwner != address(0), "Invalid new owner address");

        ownershipHistory[owner] = newOwner;
        owner = newOwner;
        emit OwnershipTransferred(owner, newOwner);
    }

    // One Time Only Function
    function emergencyKill() external onlyOwner {
        // Disable the contract
        contractDisabled = true;
    }
}

//**DISCLAIMER**

//*ChainLogic Labs is an independent retail investor and software developer creating personal projects for research purposes.
//*The information provided here is not investment advice, and there are no guarantees of returns, profits, warranties, or any monetary outcomes.
//*All projects presented by ChainLogic Labs are their personal assets, with proof of work available on a blockchain or GitHub.
//*Participants in any project with ChainLogic Labs are considered independent and bear full responsibility for their own liabilities, losses, gains, or any other outcomes.
//*ChainLogic Labs holds no responsibility or liabilities for any losses or gains that may or may not occur while using any of its projects.
//*All projects are in the early stage and involve high risk; extreme caution is advised before investing in any platform.
//*By using this program, you agree to this disclaimer and assume full responsibility for any outcomes that may or may not occur while using this program.

// @ChainLogicLabs 2024