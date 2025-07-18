// scripts/unpause-contract.js
const { ethers } = require("hardhat");

async function unpauseContract() {
  console.log("🔄 Unpausing contract...\n");
  
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  try {
    console.log("Current pause state:", await token.paused());
    
    if (await token.paused()) {
      const unpauseTx = await token.unpause();
      await unpauseTx.wait();
      console.log("✅ Contract unpaused");
    } else {
      console.log("✅ Contract already unpaused");
    }
    
    console.log("Final pause state:", await token.paused());
    
  } catch (error) {
    console.error("❌ Unpause failed:", error.message);
  }
}

if (require.main === module) {
  unpauseContract().catch(console.error);
}
