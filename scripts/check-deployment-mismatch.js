// scripts/check-deployment-mismatch.js
const { ethers } = require("hardhat");
const fs = require('fs');

async function checkDeploymentMismatch() {
  console.log("🔍 Checking for deployment mismatch...\n");
  
  try {
    console.log("=== 1. Check Local Contract ===");
    
    // Compile local contract
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    const localBytecode = VOLUME_V2.bytecode;
    console.log("Local bytecode length:", localBytecode.length);
    
    // Check if our fix is in the local bytecode
    const hasTransferFromLocal = localBytecode.includes("23b872dd");
    console.log("Local contract has transferFrom:", hasTransferFromLocal);
    
    console.log("\n=== 2. Check Deployed Contract ===");
    
    const TOKEN_ADDRESS = "0x90b2BAd3Bf208A0Ca19Ec96f3A9054B2BA565ce3";
    const deployedBytecode = await ethers.provider.getCode(TOKEN_ADDRESS);
    console.log("Deployed bytecode length:", deployedBytecode.length);
    
    const hasTransferFromDeployed = deployedBytecode.includes("23b872dd");
    console.log("Deployed contract has transferFrom:", hasTransferFromDeployed);
    
    console.log("\n=== 3. Compare Bytecodes ===");
    
    // Compare lengths
    console.log("Bytecode lengths match:", localBytecode.length === deployedBytecode.length);
    
    // Check if they're the same
    const bytecodesMatch = localBytecode.toLowerCase() === deployedBytecode.toLowerCase();
    console.log("Bytecodes match:", bytecodesMatch);
    
    if (!bytecodesMatch) {
      console.log("🚨 CRITICAL: Deployed contract is different from local!");
      console.log("This means the deployment used old code");
    }
    
    console.log("\n=== 4. Check Contract Source ===");
    
    // Check the actual transferFrom function in the source
    const contractSource = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
    console.log("Contract source length:", contractSource.length);
    
    if (contractSource.includes('_spendAllowance')) {
      console.log("❌ Source still has _spendAllowance - fix wasn't applied");
    } else if (contractSource.includes('currentAllowance >= amount')) {
      console.log("✅ Source has bulletproof transferFrom");
    } else {
      console.log("❓ Source has unknown transferFrom implementation");
    }
    
    // Show the actual transferFrom function
    const lines = contractSource.split('\n');
    console.log("\nActual transferFrom function in source:");
    let inFunction = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('function transferFrom')) {
        inFunction = true;
        braceCount = 0;
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
    
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

if (require.main === module) {
  checkDeploymentMismatch().catch(console.error);
}
