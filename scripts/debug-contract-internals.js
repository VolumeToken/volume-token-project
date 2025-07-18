// scripts/debug-contract-internals.js
const { ethers } = require("hardhat");
const fs = require('fs');

async function debugContractInternals() {
  console.log("🔍 Debugging VOLUME_V2 contract internals...\n");
  
  try {
    console.log("=== 1. Read Contract Source ===");
    
    const contractSource = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
    console.log("Contract size:", contractSource.length, "characters");
    
    // Check for problematic overrides
    const problematicFunctions = [
      'function approve(',
      'function _approve(',
      'function allowance(',
      'function _spendAllowance('
    ];
    
    problematicFunctions.forEach(func => {
      if (contractSource.includes(func)) {
        console.log(`⚠️  FOUND: ${func} - this might be the issue`);
        
        // Extract the function
        const lines = contractSource.split('\n');
        let inFunction = false;
        let braceCount = 0;
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.includes(func)) {
            inFunction = true;
            braceCount = 0;
            console.log(`Function starts at line ${i + 1}:`);
          }
          
          if (inFunction) {
            console.log(`${i + 1}: ${line}`);
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;
            
            if (braceCount === 0 && line.includes('}')) {
              break;
            }
          }
        }
      } else {
        console.log(`✅ No custom ${func}`);
      }
    });
    
    console.log("\n=== 2. Test Contract Step by Step ===");
    
    const [deployer] = await ethers.getSigners();
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    
    console.log("Contract deployed:", token.address);
    
    // Test basic state
    console.log("Total supply:", ethers.utils.formatEther(await token.totalSupply()));
    console.log("Your balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)));
    
    console.log("\n=== 3. Test Raw Approve Call ===");
    
    const testAmount = ethers.utils.parseEther("1000");
    
    // Get the exact transaction data
    const approveData = token.interface.encodeFunctionData("approve", [deployer.address, testAmount]);
    console.log("Approve call data:", approveData);
    
    // Make the raw call
    console.log("Making raw approve call...");
    const rawTx = await deployer.sendTransaction({
      to: token.address,
      data: approveData,
      gasLimit: 100000
    });
    
    const receipt = await rawTx.wait();
    console.log("Raw approve gas used:", receipt.gasUsed.toString());
    console.log("Raw approve events:", receipt.events?.length || 0);
    
    // Check allowance after raw call
    const allowanceAfterRaw = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance after raw call:", ethers.utils.formatEther(allowanceAfterRaw));
    
    console.log("\n=== 4. Compare with Standard ERC20 ===");
    
    // Create minimal comparison contract
    const minimalContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract MINIMAL is ERC20 {
    constructor() ERC20("MINIMAL", "MIN") {
        _mint(msg.sender, 50_000_000_000 * 10**18);
    }
}`;
    
    fs.writeFileSync('contracts/MINIMAL.sol', minimalContract);
    
    const MINIMAL = await ethers.getContractFactory("MINIMAL");
    const minimal = await MINIMAL.deploy();
    await minimal.deployed();
    
    console.log("Minimal contract deployed:", minimal.address);
    
    // Test minimal approve
    await minimal.approve(deployer.address, testAmount);
    const minimalAllowance = await minimal.allowance(deployer.address, deployer.address);
    console.log("Minimal allowance:", ethers.utils.formatEther(minimalAllowance));
    
    if (minimalAllowance.gt(0) && allowanceAfterRaw.eq(0)) {
      console.log("🎯 CONFIRMED: Issue is in VOLUME_V2 contract logic");
      console.log("The minimal ERC20 works, but VOLUME_V2 doesn't");
    }
    
    console.log("\n=== 5. Check Constructor Issues ===");
    
    // Check if constructor set things up correctly
    console.log("Anti-whale enabled:", await token.antiWhaleEnabled());
    console.log("Fees enabled:", await token.feesEnabled());
    console.log("Contract paused:", await token.paused());
    console.log("Deployer fee exempt:", await token.feeExempt(deployer.address));
    console.log("Deployer max TX exempt:", await token.maxTxExempt(deployer.address));
    
  } catch (error) {
    console.error("❌ Internal debug failed:", error.message);
  }
}

if (require.main === module) {
  debugContractInternals().catch(console.error);
}
