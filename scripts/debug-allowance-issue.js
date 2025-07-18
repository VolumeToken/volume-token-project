// scripts/debug-allowance-issue.js
const { ethers } = require("hardhat");

async function debugAllowanceIssue() {
  console.log("🔍 Debugging allowance issue specifically...\n");
  
  // REPLACE WITH YOUR CONTRACT ADDRESS
  const TOKEN_ADDRESS = "0x6DB1004550b50a466b1cDb158f6d79D156313444";
  
  const [deployer] = await ethers.getSigners();
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  
  const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
  const token = VOLUME_V2.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== 1. Test Allowance Progression ===");
    
    const testAmount = ethers.utils.parseEther("10000");
    
    // Reset allowance to 0
    await token.approve(ROUTER_ADDRESS, 0);
    console.log("Allowance reset to 0");
    
    // Set fresh allowance
    await token.approve(ROUTER_ADDRESS, testAmount);
    const allowance1 = await token.allowance(deployer.address, ROUTER_ADDRESS);
    console.log("Fresh allowance:", ethers.utils.formatEther(allowance1));
    
    // Try transferFrom with 1 token (this should work)
    console.log("\n=== 2. Test Small Amount ===");
    await token.transferFrom(deployer.address, ROUTER_ADDRESS, ethers.utils.parseEther("1"));
    console.log("✅ Small transferFrom successful");
    
    // Check allowance after small transfer
    const allowance2 = await token.allowance(deployer.address, ROUTER_ADDRESS);
    console.log("Allowance after small transfer:", ethers.utils.formatEther(allowance2));
    console.log("Expected:", ethers.utils.formatEther(testAmount.sub(ethers.utils.parseEther("1"))));
    console.log("Allowance reduced correctly:", allowance2.eq(testAmount.sub(ethers.utils.parseEther("1"))));
    
    // Try transferFrom with larger amount
    console.log("\n=== 3. Test Large Amount ===");
    
    const largeAmount = ethers.utils.parseEther("5000");
    console.log("Trying to transfer:", ethers.utils.formatEther(largeAmount));
    console.log("Current allowance:", ethers.utils.formatEther(allowance2));
    console.log("Should work:", allowance2.gte(largeAmount));
    
    try {
      await token.transferFrom(deployer.address, ROUTER_ADDRESS, largeAmount);
      console.log("✅ Large transferFrom successful");
      
      const allowance3 = await token.allowance(deployer.address, ROUTER_ADDRESS);
      console.log("Allowance after large transfer:", ethers.utils.formatEther(allowance3));
      
    } catch (error) {
      console.log("❌ Large transferFrom failed:", error.message);
      
      // Check if allowance was consumed even though transfer failed
      const allowanceAfterFail = await token.allowance(deployer.address, ROUTER_ADDRESS);
      console.log("Allowance after failed transfer:", ethers.utils.formatEther(allowanceAfterFail));
      
      if (allowanceAfterFail.lt(allowance2)) {
        console.log("🔍 BUG: Allowance was consumed even though transfer failed!");
      } else {
        console.log("🔍 Allowance unchanged - issue elsewhere");
      }
    }
    
    console.log("\n=== 4. Test the _spendAllowance Function ===");
    
    // The issue might be in our usage of _spendAllowance
    console.log("Our transferFrom function calls _spendAllowance");
    console.log("This might be causing the allowance issue");
    
    console.log("\n=== 5. HYPOTHESIS ===");
    console.log("The issue is likely in our transferFrom implementation:");
    console.log("- _spendAllowance might not work as expected");
    console.log("- There might be a race condition");
    console.log("- Large amounts might cause overflow/underflow");
    console.log("- The order of operations might be wrong");
    
  } catch (error) {
    console.error("❌ Allowance debug failed:", error.message);
  }
}

if (require.main === module) {
  debugAllowanceIssue().catch(console.error);
}
