// scripts/create-working-contract.js
const fs = require('fs');

function createWorkingContract() {
  console.log("🔧 Creating a working contract from scratch...\n");
  
  const workingContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VOLUME_WORKING is ERC20, Ownable {
    uint256 public constant TOTAL_SUPPLY = 50_000_000_000 * 10**18;
    
    // Simple mappings for now
    mapping(address => bool) public feeExempt;
    
    constructor() ERC20("VOLUME", "VLM") {
        _mint(msg.sender, TOTAL_SUPPLY);
        feeExempt[msg.sender] = true;
    }
    
    // Test: Does basic approve work?
    // (This should work since we're using pure OpenZeppelin ERC20)
    
    // Test: Does basic transferFrom work?
    // (This should work since we're using pure OpenZeppelin ERC20)
    
    // Once basic functions work, we can add custom logic
    
    function setFeeExempt(address account, bool exempt) external onlyOwner {
        feeExempt[account] = exempt;
    }
}
`;
  
  fs.writeFileSync('contracts/VOLUME_WORKING.sol', workingContract);
  console.log("✅ Created VOLUME_WORKING.sol");
  
  console.log("\n📝 This contract:");
  console.log("- Uses pure OpenZeppelin ERC20 (no custom approve/transferFrom)");
  console.log("- Has minimal functionality");
  console.log("- Should work perfectly");
  console.log("- Can be extended once basic functions are confirmed");
}

if (require.main === module) {
  createWorkingContract();
}
