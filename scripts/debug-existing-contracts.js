// scripts/debug-existing-contracts.js
const { ethers } = require("hardhat");
const fs = require('fs');

async function debugExistingContracts() {
  console.log("🔍 Debugging existing contracts...\n");
  
  try {
    console.log("=== 1. Check Contract Files ===");
    
    // List all contract files
    const contractFiles = fs.readdirSync('contracts/').filter(f => f.endsWith('.sol'));
    console.log("Contract files found:");
    contractFiles.forEach(file => console.log(`  - ${file}`));
    
    console.log("\n=== 2. Check VOLUME_V2.sol Content ===");
    
    if (contractFiles.includes('VOLUME_V2.sol')) {
      const content = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
      console.log("VOLUME_V2.sol length:", content.length);
      
      // Check for critical parts
      const hasTransferFrom = content.includes('function transferFrom');
      const hasSpendAllowance = content.includes('_spendAllowance');
      const hasOverride = content.includes('override');
      
      console.log("Has transferFrom function:", hasTransferFrom);
      console.log("Has _spendAllowance call:", hasSpendAllowance);
      console.log("Has override keyword:", hasOverride);
      
      if (hasTransferFrom) {
        // Extract the transferFrom function
        const lines = content.split('\n');
        console.log("\ntransferFrom function found at lines:");
        lines.forEach((line, index) => {
          if (line.includes('transferFrom')) {
            console.log(`${index + 1}: ${line.trim()}`);
          }
        });
      }
      
    } else {
      console.log("❌ VOLUME_V2.sol not found!");
    }
    
    console.log("\n=== 3. Try Compiling Individual Contracts ===");
    
    // Test each contract that should exist
    const contractsToTest = ['VOLUME_V2', 'VOLUME_FIXED', 'VOLUME_GUARANTEED_FIX'];
    
    for (const contractName of contractsToTest) {
      try {
        console.log(`Testing ${contractName}...`);
        const factory = await ethers.getContractFactory(contractName);
        console.log(`✅ ${contractName} compiled successfully`);
        
        // Check bytecode for transferFrom
        const bytecode = factory.bytecode;
        const hasTransferFromInBytecode = bytecode.includes('23b872dd'); // transferFrom selector
        console.log(`  transferFrom in bytecode: ${hasTransferFromInBytecode}`);
        
      } catch (error) {
        console.log(`❌ ${contractName} failed: ${error.message}`);
      }
    }
    
    console.log("\n=== 4. Check Compilation Artifacts ===");
    
    if (fs.existsSync('artifacts/contracts/')) {
      const artifactDirs = fs.readdirSync('artifacts/contracts/');
      console.log("Artifact directories:");
      artifactDirs.forEach(dir => console.log(`  - ${dir}`));
      
      // Check VOLUME_V2 specifically
      if (fs.existsSync('artifacts/contracts/VOLUME_V2.sol/')) {
        const v2Artifacts = fs.readdirSync('artifacts/contracts/VOLUME_V2.sol/');
        console.log("VOLUME_V2 artifacts:");
        v2Artifacts.forEach(file => console.log(`  - ${file}`));
        
        if (fs.existsSync('artifacts/contracts/VOLUME_V2.sol/VOLUME_V2.json')) {
          const artifact = JSON.parse(fs.readFileSync('artifacts/contracts/VOLUME_V2.sol/VOLUME_V2.json', 'utf8'));
          const transferFromABI = artifact.abi.find(item => item.name === 'transferFrom');
          
          if (transferFromABI) {
            console.log("✅ transferFrom found in ABI");
          } else {
            console.log("❌ transferFrom NOT in ABI - this is the problem!");
          }
        }
      }
    } else {
      console.log("❌ No artifacts directory found");
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugExistingContracts().catch(console.error);
}
