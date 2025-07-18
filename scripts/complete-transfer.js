// scripts/complete-transfer.js
const { ethers } = require("hardhat");

async function completeTransfer() {
  console.log("🔧 Completing vesting transfer...\n");
  
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  const VESTING_ADDRESS = "0xDBb24DA2Fda94C60f59080ecebA1138dD925FC45";
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  try {
    const totalSupply = await token.totalSupply();
    const teamTokens = totalSupply.mul(5).div(100); // 5%
    
    console.log("Transferring:", ethers.utils.formatEther(teamTokens), "tokens");
    console.log("From:", await token.owner());
    console.log("To:", VESTING_ADDRESS);
    
    // Simple transfer with manual gas limit
    const transferTx = await token.transfer(VESTING_ADDRESS, teamTokens, {
      gasLimit: 200000
    });
    
    console.log("Transaction hash:", transferTx.hash);
    console.log("Waiting for confirmation...");
    
    await transferTx.wait();
    console.log("✅ Transfer completed!");
    
    const vestingBalance = await token.balanceOf(VESTING_ADDRESS);
    console.log("Vesting balance:", ethers.utils.formatEther(vestingBalance));
    
  } catch (error) {
    console.error("❌ Transfer failed:", error.message);
    console.log("\n🔧 Manual solution:");
    console.log("1. Go to Sepolia Etherscan");
    console.log("2. Connect your wallet to the token contract");
    console.log("3. Use the transfer function manually");
  }
}

if (require.main === module) {
  completeTransfer().catch(console.error);
}
