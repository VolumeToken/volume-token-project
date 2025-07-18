// scripts/debug-compilation.js
const { ethers } = require("hardhat");
const fs = require('fs');

async function debugCompilation() {
  console.log("🔍 Debugging compilation issue...\n");
  
  try {
    // Check if VOLUME_V2.sol exists and what's in it
    console.log("=== 1. Checking VOLUME_V2.sol File ===");
    
    if (fs.existsSync('contracts/VOLUME_V2.sol')) {
      const contractContent = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
      console.log("✅ VOLUME_V2.sol exists");
      console.log("File length:", contractContent.length);
      
      // Check for transferFrom function
      if (contractContent.includes('function transferFrom')) {
        console.log("✅ transferFrom function found in source code");
        
        // Extract the transferFrom function
        const lines = contractContent.split('\n');
        const transferFromLines = [];
        let inTransferFrom = false;
        let braceCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes('function transferFrom')) {
            inTransferFrom = true;
            transferFromLines.push(`${i + 1}: ${line}`);
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
          } else if (inTransferFrom) {
            transferFromLines.push(`${i + 1}: ${line}`);
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            if (braceCount === 0) {
              break;
            }
          }
        }
        
        console.log("transferFrom function in source:");
        transferFromLines.forEach(line => console.log(line));
        
      } else {
        console.log("❌ transferFrom function NOT found in source code!");
      }
      
      // Check for other potential issues
      if (contractContent.includes('override')) {
        console.log("✅ Contract uses override keyword");
      }
      
      if (contractContent.includes('_spendAllowance')) {
        console.log("✅ _spendAllowance function call found");
      } else {
        console.log("❌ _spendAllowance function call NOT found");
      }
      
    } else {
      console.log("❌ VOLUME_V2.sol does not exist!");
    }
    
    console.log("\n=== 2. Creating Minimal Test Contract ===");
    
    // Create a minimal contract to test transferFrom compilation
    const minimalContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestTransferFrom is ERC20 {
    constructor() ERC20("Test", "TEST") {
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }
}
`;
    
    fs.writeFileSync('contracts/TestTransferFrom.sol', minimalContract);
    console.log("✅ TestTransferFrom.sol created");
    
    // Compile and test the minimal contract
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a bit
    
    console.log("\n=== 3. Testing Minimal Contract ===");
    
    try {
      const TestContract = await ethers.getContractFactory("TestTransferFrom");
      const bytecode = TestContract.bytecode;
      
      console.log("TestTransferFrom bytecode length:", bytecode.length);
      
      // Check for transferFrom in bytecode (look for function selector)
      const transferFromSelector = "0x23b872dd"; // transferFrom function selector
      if (bytecode.includes(transferFromSelector.substring(2))) {
        console.log("✅ transferFrom function selector found in minimal contract");
      } else {
        console.log("❌ transferFrom function selector NOT found in minimal contract");
      }
      
      // Test deployment
      const [deployer] = await ethers.getSigners();
      const testToken = await TestContract.deploy();
      await testToken.deployed();
      console.log("✅ Test contract deployed");
      
      // Test transferFrom
      await testToken.approve(deployer.address, ethers.utils.parseEther("1000"));
      await testToken.transferFrom(deployer.address, deployer.address, ethers.utils.parseEther("1"));
      console.log("✅ transferFrom works in test contract!");
      
    } catch (error) {
      console.error("❌ Test contract failed:", error.message);
    }
    
    console.log("\n=== 4. Checking Compilation Artifacts ===");
    
    // Check what contracts were actually compiled
    if (fs.existsSync('artifacts/contracts/VOLUME_V2.sol/VOLUME_V2.json')) {
      const artifact = JSON.parse(fs.readFileSync('artifacts/contracts/VOLUME_V2.sol/VOLUME_V2.json', 'utf8'));
      console.log("VOLUME_V2 artifact exists");
      console.log("Contract name in artifact:", artifact.contractName);
      
      // Check ABI for transferFrom
      const transferFromABI = artifact.abi.find(item => item.name === 'transferFrom');
      if (transferFromABI) {
        console.log("✅ transferFrom found in ABI");
        console.log("transferFrom ABI:", transferFromABI);
      } else {
        console.log("❌ transferFrom NOT found in ABI");
      }
      
    } else {
      console.log("❌ VOLUME_V2 artifact does not exist");
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugCompilation().catch(console.error);
}
