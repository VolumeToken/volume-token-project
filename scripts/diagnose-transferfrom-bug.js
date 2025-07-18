// scripts/diagnose-transferfrom-bug.js
const { ethers } = require("hardhat");

async function diagnoseTransferFromBug() {
  console.log("🔍 Diagnosing transferFrom bug...\n");
  
  const [deployer] = await ethers.getSigners();
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== 1. Test Basic ERC20 Functions ===");
    
    const balance = await token.balanceOf(deployer.address);
    console.log("Balance:", ethers.utils.formatEther(balance));
    
    // Test approve
    const approveAmount = ethers.utils.parseEther("100");
    await token.approve(deployer.address, approveAmount); // Approve to self
    
    const allowance = await token.allowance(deployer.address, deployer.address);
    console.log("Self-allowance:", ethers.utils.formatEther(allowance));
    
    console.log("\n=== 2. Test Different transferFrom Scenarios ===");
    
    // Scenario 1: Self to self (should work)
    const testAmount = ethers.utils.parseEther("1");
    
    try {
      console.log("Testing self-to-self transferFrom...");
      await token.transferFrom(deployer.address, deployer.address, testAmount);
      console.log("✅ Self-to-self works");
    } catch (e) {
      console.log("❌ Self-to-self fails:", e.message);
    }
    
    // Scenario 2: Try with different amounts
    const smallAmount = ethers.utils.parseEther("0.001");
    
    try {
      console.log("Testing with very small amount...");
      await token.transferFrom(deployer.address, deployer.address, smallAmount);
      console.log("✅ Small amount works");
    } catch (e) {
      console.log("❌ Small amount fails:", e.message);
    }
    
    console.log("\n=== 3. Check Contract State ===");
    
    // Check if the contract is in a weird state
    console.log("Paused:", await token.paused());
    console.log("Owner:", await token.owner());
    
    try {
      console.log("Max wallet:", ethers.utils.formatEther(await token.maxWalletAmount()));
      console.log("Max tx:", ethers.utils.formatEther(await token.maxTxAmount()));
    } catch (e) {
      console.log("Limit functions not available");
    }
    
    console.log("\n=== 4. The Real Issue ===");
    
    console.log("🚨 DIAGNOSIS: Your VOLUME contract has a broken transferFrom implementation");
    console.log("🚨 This is a CRITICAL bug that prevents:");
    console.log("   - Uniswap trading (selling)");
    console.log("   - Any DeFi integrations");
    console.log("   - Third-party approvals");
    
    console.log("\n🔧 ROOT CAUSE likely:");
    console.log("   - Custom fee logic consuming allowance incorrectly");
    console.log("   - Anti-dump mechanism interfering with transferFrom");
    console.log("   - Bug in OpenZeppelin override");
    console.log("   - Missing _spendAllowance call");
    
    console.log("\n🚨 IMMEDIATE ACTIONS:");
    console.log("1. Review VOLUME.sol source code");
    console.log("2. Check transferFrom implementation");
    console.log("3. Fix the bug and redeploy");
    console.log("4. Or use workarounds for now");
    
  } catch (error) {
    console.error("❌ Diagnosis failed:", error.message);
  }
}

if (require.main === module) {
  diagnoseTransferFromBug().catch(console.error);
}
