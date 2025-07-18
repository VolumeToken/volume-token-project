// scripts/owner-trading-workaround.js
const { ethers } = require("hardhat");

async function ownerTradingWorkaround() {
  console.log("🔄 Owner-only trading workaround...\n");
  
  const [deployer] = await ethers.getSigners();
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== Workaround: Owner Can Override ===");
    
    const owner = await token.owner();
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ You're not the owner - workaround won't work");
      return;
    }
    
    console.log("✅ You are the owner - you can use direct transfers");
    
    // Since transferFrom is broken, we can:
    // 1. Use direct transfers only
    // 2. Create a custom trading function
    // 3. Temporarily disable all restrictions
    
    const sellAmount = ethers.utils.parseEther("100");
    
    console.log("=== Method 1: Direct Transfer to Router ===");
    
    // Transfer tokens directly to router
    await token.transfer(ROUTER_ADDRESS, sellAmount);
    console.log("✅ Tokens transferred to router");
    
    // Now the router has the tokens, but this doesn't help with selling
    // because the router expects to use transferFrom
    
    console.log("\n=== Method 2: Create Custom Sell Function ===");
    
    // If your contract has a custom sell function for the owner
    try {
      await token.ownerSell(sellAmount, ethers.constants.AddressZero);
      console.log("✅ Owner sell function worked");
    } catch (e) {
      console.log("❌ No owner sell function available");
    }
    
    console.log("\n=== Method 3: Emergency Actions ===");
    
    console.log("🚨 IMMEDIATE RECOMMENDATION:");
    console.log("1. Your token is NOT ready for public trading");
    console.log("2. The transferFrom bug must be fixed");
    console.log("3. Consider deploying a new version");
    console.log("4. Or add an emergency fix function to the contract");
    
  } catch (error) {
    console.error("❌ Workaround failed:", error.message);
  }
}

if (require.main === module) {
  ownerTradingWorkaround().catch(console.error);
}
