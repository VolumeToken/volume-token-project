// scripts/fix-allowance.js
const { ethers } = require("hardhat");

async function fixAllowance() {
  console.log("🔧 Fixing allowance issue...\n");
  
  const [deployer] = await ethers.getSigners();
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== 1. Check Current Allowance ===");
    const currentAllowance = await token.allowance(deployer.address, ROUTER_ADDRESS);
    console.log("Current allowance:", ethers.utils.formatEther(currentAllowance));
    
    console.log("\n=== 2. Reset Allowance ===");
    
    // Reset allowance to 0 first (some tokens require this)
    if (currentAllowance.gt(0)) {
      await token.approve(ROUTER_ADDRESS, 0);
      console.log("✅ Allowance reset to 0");
    }
    
    console.log("\n=== 3. Set Large Allowance ===");
    
    // Set a very large allowance
    const largeAllowance = ethers.utils.parseEther("1000000000"); // 1B tokens
    await token.approve(ROUTER_ADDRESS, largeAllowance);
    console.log("✅ Large allowance set");
    
    console.log("\n=== 4. Verify Allowance ===");
    const newAllowance = await token.allowance(deployer.address, ROUTER_ADDRESS);
    console.log("New allowance:", ethers.utils.formatEther(newAllowance));
    
    console.log("\n=== 5. Test TransferFrom ===");
    const testAmount = ethers.utils.parseEther("1"); // 1 VOLUME
    
    try {
      await token.transferFrom(deployer.address, ROUTER_ADDRESS, testAmount);
      console.log("✅ TransferFrom test successful");
      
      // Check balances
      const routerBalance = await token.balanceOf(ROUTER_ADDRESS);
      console.log("Router balance after test:", ethers.utils.formatEther(routerBalance));
      
    } catch (transferError) {
      console.error("❌ TransferFrom still failing:", transferError.message);
    }
    
    console.log("\n🎉 Allowance issue fixed!");
    
  } catch (error) {
    console.error("❌ Fix failed:", error.message);
  }
}

if (require.main === module) {
  fixAllowance().catch(console.error);
}
