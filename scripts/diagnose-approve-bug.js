// scripts/diagnose-approve-bug.js
const { ethers } = require("hardhat");
const fs = require('fs');

async function diagnoseApproveBug() {
  console.log("🔍 Diagnosing exact approve bug...\n");
  
  try {
    // First, let's see what's actually in your contract
    console.log("=== 1. Check Contract Source ===");
    
    const contractSource = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
    console.log("Contract size:", contractSource.length, "characters");
    
    // Check if there's a custom approve function (there shouldn't be)
    if (contractSource.includes('function approve(')) {
      console.log("🚨 FOUND THE BUG: Custom approve function exists!");
      console.log("This is overriding the working OpenZeppelin approve");
      
      // Find and show it
      const lines = contractSource.split('\n');
      let inApprove = false;
      let braceCount = 0;
      
      console.log("\nCustom approve function:");
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
      console.log("✅ No custom approve function - using inherited");
    }
    
    // Check for _approve override
    if (contractSource.includes('function _approve(')) {
      console.log("⚠️  Custom _approve function found");
    }
    
    console.log("\n=== 2. Check Deployed Contract ===");
    
    const [deployer] = await ethers.getSigners();
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    
    // Deploy for testing
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    
    console.log("Contract deployed for testing:", token.address);
    
    console.log("\n=== 3. Test Standard ERC20 Functions ===");
    
    // Test basic ERC20 functions one by one
    console.log("Testing balanceOf...");
    const balance = await token.balanceOf(deployer.address);
    console.log("Balance:", ethers.utils.formatEther(balance));
    
    if (balance.eq(0)) {
      console.log("🚨 CRITICAL: No tokens minted - constructor issue!");
      return;
    }
    
    console.log("Testing allowance (before approve)...");
    const allowanceBefore = await token.allowance(deployer.address, deployer.address);
    console.log("Initial allowance:", ethers.utils.formatEther(allowanceBefore));
    
    console.log("\n=== 4. Test Approve Step by Step ===");
    
    const testAmount = ethers.utils.parseEther("1000");
    
    try {
      console.log("Calling approve function...");
      
      // Check if approve function exists and is callable
      const approveTx = await token.populateTransaction.approve(deployer.address, testAmount);
      console.log("Approve transaction data:", approveTx.data?.substring(0, 20) + "...");
      
      // Execute approve
      const approveResponse = await token.approve(deployer.address, testAmount);
      console.log("Approve tx hash:", approveResponse.hash);
      
      const receipt = await approveResponse.wait();
      console.log("Approve tx mined, gas used:", receipt.gasUsed.toString());
      
      // Check events
      console.log("Events in approve tx:", receipt.events?.length || 0);
      if (receipt.events) {
        receipt.events.forEach((event, i) => {
          console.log(`Event ${i}:`, event.event, event.args?.value?.toString());
        });
      }
      
      // Check allowance after
      const allowanceAfter = await token.allowance(deployer.address, deployer.address);
      console.log("Allowance after approve:", ethers.utils.formatEther(allowanceAfter));
      
      if (allowanceAfter.eq(0)) {
        console.log("🚨 BUG CONFIRMED: Approve executes but allowance stays 0!");
        console.log("This means the approve function is broken internally");
      } else {
        console.log("✅ Approve works correctly");
      }
      
    } catch (error) {
      console.log("🚨 Approve function call failed:", error.message);
    }
    
    console.log("\n=== 5. Check for Custom Logic Interference ===");
    
    // Check if any of your custom functions are interfering
    console.log("Anti-whale enabled:", await token.antiWhaleEnabled());
    console.log("Fees enabled:", await token.feesEnabled());
    console.log("Contract paused:", await token.paused());
    
    // Check if _transfer is somehow being called during approve
    const balanceBeforeApprove = await token.balanceOf(deployer.address);
    
    try {
      await token.approve(deployer.address, 0); // Reset
      await token.approve(deployer.address, testAmount);
    } catch (error) {
      console.log("Approve failed in interference test:", error.message);
    }
    
    const balanceAfterApprove = await token.balanceOf(deployer.address);
    
    if (!balanceBeforeApprove.eq(balanceAfterApprove)) {
      console.log("🚨 CRITICAL BUG: Approve is moving tokens!");
      console.log("Balance before:", ethers.utils.formatEther(balanceBeforeApprove));
      console.log("Balance after:", ethers.utils.formatEther(balanceAfterApprove));
      console.log("This means _transfer is being called during approve");
    }
    
  } catch (error) {
    console.error("❌ Diagnosis failed:", error.message);
  }
}

if (require.main === module) {
  diagnoseApproveBug().catch(console.error);
}
