// scripts/debug-approve-simple.js
const { ethers } = require("hardhat");
const fs = require('fs');

async function debugApproveSimple() {
  console.log("🔍 Simple approve function debug...\n");
  
  try {
    console.log("=== 1. Check VOLUME_V2 Source ===");
    
    const contractSource = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
    
    // Check if we have a custom approve function
    if (contractSource.includes('function approve(')) {
      console.log("⚠️  Contract has custom approve function - this might be the issue!");
      
      // Find and show the approve function
      const lines = contractSource.split('\n');
      let inApprove = false;
      let braceCount = 0;
      
      console.log("Custom approve function:");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('function approve(')) {
          inApprove = true;
          braceCount = 0;
        }
        
        if (inApprove) {
          console.log(`${i + 1}: ${line}`);
          braceCount += (line.match(/{/g) || []).length;
          braceCount -= (line.match(/}/g) || []).length;
          
          if (braceCount === 0 && line.includes('}')) {
            break;
          }
        }
      }
    } else {
      console.log("✅ Contract uses inherited approve function");
    }
    
    // Check for custom _approve function
    if (contractSource.includes('function _approve(')) {
      console.log("⚠️  Contract has custom _approve function!");
    }
    
    console.log("\n=== 2. Check Contract Inheritance ===");
    
    const inheritanceMatches = contractSource.match(/contract VOLUME_V2 is (.+) \{/);
    if (inheritanceMatches) {
      console.log("VOLUME_V2 inherits from:", inheritanceMatches[1]);
    }
    
    console.log("\n=== 3. Test VOLUME_V2 with Error Details ===");
    
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    const [deployer] = await ethers.getSigners();
    
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    
    console.log("VOLUME_V2 deployed locally");
    
    const testAmount = ethers.utils.parseEther("1000");
    
    // Check contract state
    console.log("Contract paused:", await token.paused());
    console.log("Contract owner:", await token.owner());
    console.log("Deployer address:", deployer.address);
    
    // Try approve with detailed error handling
    console.log("\n=== 4. Detailed Approve Test ===");
    
    try {
      console.log("Attempting approve...");
      
      const approveTx = await token.approve(deployer.address, testAmount);
      console.log("Approve transaction hash:", approveTx.hash);
      
      const receipt = await approveTx.wait();
      console.log("Approve transaction mined, gas used:", receipt.gasUsed.toString());
      
      // Check events
      console.log("Events in transaction:", receipt.events?.length || 0);
      
      if (receipt.events) {
        receipt.events.forEach((event, index) => {
          console.log(`Event ${index}:`, event.event, event.args);
        });
      }
      
      // Check allowance
      const allowance = await token.allowance(deployer.address, deployer.address);
      console.log("Allowance after approve:", ethers.utils.formatEther(allowance));
      
      if (allowance.eq(0)) {
        console.log("❌ CRITICAL: Approve succeeded but allowance is 0!");
        console.log("This suggests the approve function is overridden and broken");
      } else {
        console.log("✅ Approve works correctly!");
      }
      
    } catch (error) {
      console.log("❌ Approve failed:", error.message);
    }
    
    console.log("\n=== 5. Check for Overrides ===");
    
    // Check if there are any function overrides that might be breaking things
    const overrides = [
      'function approve(',
      'function _approve(',
      'function _transfer(',
      'function allowance(',
      'function _spendAllowance('
    ];
    
    overrides.forEach(override => {
      if (contractSource.includes(override)) {
        console.log(`⚠️  Contract overrides: ${override}`);
      }
    });
    
    console.log("\n=== 6. DIAGNOSIS ===");
    console.log("The issue is likely:");
    console.log("1. Custom _transfer function interfering with approve");
    console.log("2. Paused state blocking approve");
    console.log("3. Custom approve/allowance override");
    console.log("4. Inheritance conflict");
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugApproveSimple().catch(console.error);
}
