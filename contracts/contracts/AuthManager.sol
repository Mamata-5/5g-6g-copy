// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract AuthManager {
    struct User {
        bool isRegistered;
        string walletAddress; // Redundant as mapping key is address, but useful for struct retrieval
        uint256 registrationTime;
        uint256 requestCount;
        bool isBanned;
    }

    mapping(address => User) public users;
    address public owner;

    event UserRegistered(address indexed wallet, uint256 time);
    event AccessRequested(address indexed wallet, uint256 time, string resource);
    event UserBanned(address indexed wallet, string reason);

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyRegistered() {
        require(users[msg.sender].isRegistered, "User not registered");
        require(!users[msg.sender].isBanned, "User is banned");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function registerUser() external {
        require(!users[msg.sender].isRegistered, "Already registered");
        
        users[msg.sender] = User({
            isRegistered: true,
            walletAddress: _toAsciiString(msg.sender),
            registrationTime: block.timestamp,
            requestCount: 0,
            isBanned: false
        });

        emit UserRegistered(msg.sender, block.timestamp);
    }

    function requestAccess(string calldata resource) external onlyRegistered {
        users[msg.sender].requestCount++;
        emit AccessRequested(msg.sender, block.timestamp, resource);
    }

    function banUser(address _user, string calldata reason) external onlyOwner {
        require(users[_user].isRegistered, "User not found");
        users[_user].isBanned = true;
        emit UserBanned(_user, reason);
    }

    function isUserRegistered(address _user) external view returns (bool) {
        return users[_user].isRegistered && !users[_user].isBanned;
    }

    // Helper to convert address to string (simplified for demo)
    function _toAsciiString(address x) internal pure returns (string memory) {
        bytes memory s = new bytes(40);
        for (uint i = 0; i < 20; i++) {
            bytes1 b = bytes1(uint8(uint(uint160(x)) / (2**(8*(19 - i)))));
            bytes1 hi = bytes1(uint8(b) / 16);
            bytes1 lo = bytes1(uint8(b) - 16 * uint8(hi));
            s[2*i] = char(hi);
            s[2*i+1] = char(lo);            
        }
        return string(s);
    }

    function char(bytes1 b) internal pure returns (bytes1 c) {
        if (uint8(b) < 10) return bytes1(uint8(b) + 0x30);
        else return bytes1(uint8(b) + 0x57);
    }
}
