// scripts/check-exemption-functions.js
const { ethers } = require("hardhat");

async function checkExemptionFunctions() {
  console.log("🔍 Checking exemption functions...\n");
  
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== 1. Checking Owner ===");
    const owner = await token.owner();
    const [deployer] = await ethers.getSigners();
    console.log("Token owner:", owner);
    console.log("Deployer:", deployer.address);
    console.log("Is deployer owner?", owner.toLowerCase() === deployer.address.toLowerCase());
    
    console.log("\n=== 2. Checking Function Existence ===");
    
    // Check if functions exist and work
    try {
      console.log("Testing setMaxWalletExempt...");
      const tx1 = await token.setMaxWalletExempt(ROUTER_ADDRESS, true);
      const receipt1 = await tx1.wait();
      console.log("✅ setMaxWalletExempt tx confirmed:", receipt1.transactionHash);
      
      // Wait a bit and check
      await new Promise(resolve => setTimeout(resolve, 2000));
      const isExempt = await token.maxWalletExempt(ROUTER_ADDRESS);
      console.log("Router max wallet exempt after tx:", isExempt);
      
    } catch (error) {
      console.error("❌ setMaxWalletExempt failed:", error.message);
    }
    
    console.log("\n=== 3. Try Setting Exemptions One by One ===");
    
    try {
      console.log("Setting max wallet exemption...");
      const tx1 = await token.setMaxWalletExempt(ROUTER_ADDRESS, true);
      await tx1.wait();
      console.log("Tx hash:", tx1.hash);
      
      console.log("Setting max tx exemption...");
      const tx2 = await token.setMaxTxExempt(ROUTER_ADDRESS, true);
      await tx2.wait();
      console.log("Tx hash:", tx2.hash);
      
      console.log("Setting fee exemption...");
      const tx3 = await token.setFeeExempt(ROUTER_ADDRESS, true);
      await tx3.wait();
      console.log("Tx hash:", tx3.hash);
      
      console.log("\n=== 4. Final Check ===");
      console.log("Max wallet exempt:", await token.maxWalletExempt(ROUTER_ADDRESS));
      console.log("Max tx exempt:", await token.maxTxExempt(ROUTER_ADDRESS));
      console.log("Fee exempt:", await token.feeExempt(ROUTER_ADDRESS));
      
    } catch (error) {
      console.error("❌ Error setting exemptions:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Check failed:", error.message);
  }
}

if (require.main === module) {
  checkExemptionFunctions().catch(console.error);
}
