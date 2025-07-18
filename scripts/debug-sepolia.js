// scripts/debug-sepolia.js - FIXED
const { ethers } = require("hardhat");

async function debugSepolia() {
  console.log("🔍 Debugging Sepolia deployment...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  
  // Your deployed contract addresses (properly checksummed)
  const TOKEN_ADDRESS = ethers.utils.getAddress("0x95704fD69a2Ad32a2A4127C82A9147c8355415da");
  const VESTING_ADDRESS = ethers.utils.getAddress("0xDBb24DA2Fda94C60f59080ecebA1138dD925FC45");
  const TIMELOCK_ADDRESS = ethers.utils.getAddress("0x6A8b74C4A0C290788f94708987b99Fd709d8dfaC");
  
  console.log("Token Address:", TOKEN_ADDRESS);
  console.log("Vesting Address:", VESTING_ADDRESS);
  console.log("Timelock Address:", TIMELOCK_ADDRESS);
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  try {
    console.log("\n=== 1. Checking Current State ===");
    const totalSupply = await token.totalSupply();
    const teamTokens = totalSupply.mul(5).div(100);
    
    console.log("Total Supply:", ethers.utils.formatEther(totalSupply));
    console.log("Team Tokens (5%):", ethers.utils.formatEther(teamTokens));
    console.log("Deployer Balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)));
    console.log("Vesting Balance:", ethers.utils.formatEther(await token.balanceOf(VESTING_ADDRESS)));
    
    console.log("\n=== 2. Checking Token Settings ===");
    console.log("Owner:", await token.owner());
    console.log("Trading Enabled:", await token.tradingEnabled());
    console.log("Paused:", await token.paused());
    
    console.log("\n=== 3. Checking Exemptions ===");
    console.log("Vesting max wallet exempt:", await token.maxWalletExempt(VESTING_ADDRESS));
    console.log("Vesting max tx exempt:", await token.maxTxExempt(VESTING_ADDRESS));
    console.log("Vesting fee exempt:", await token.feeExempt(VESTING_ADDRESS));
    
    console.log("\n=== 4. Checking Limits ===");
    const maxWallet = await token.maxWalletAmount();
    const maxTx = await token.maxTxAmount();
    console.log("Max Wallet Amount:", ethers.utils.formatEther(maxWallet));
    console.log("Max Tx Amount:", ethers.utils.formatEther(maxTx));
    console.log("Team tokens vs Max Wallet:", ethers.utils.formatEther(teamTokens), "vs", ethers.utils.formatEther(maxWallet));
    
    console.log("\n=== 5. Setting All Exemptions ===");
    
    try {
      console.log("Setting max wallet exemption...");
      const tx1 = await token.setMaxWalletExempt(VESTING_ADDRESS, true);
      await tx1.wait();
      console.log("✅ Max wallet exemption set");
      
      console.log("Setting max tx exemption...");
      const tx2 = await token.setMaxTxExempt(VESTING_ADDRESS, true);
      await tx2.wait();
      console.log("✅ Max tx exemption set");
      
      console.log("Setting fee exemption...");
      const tx3 = await token.setFeeExempt(VESTING_ADDRESS, true);
      await tx3.wait();
      console.log("✅ Fee exemption set");
      
      console.log("Setting anti-dump exemption...");
      const tx4 = await token.setAntiDumpExempt(VESTING_ADDRESS, true);
      await tx4.wait();
      console.log("✅ Anti-dump exemption set");
      
    } catch (exemptionError) {
      console.error("❌ Error setting exemptions:", exemptionError.message);
    }
    
    console.log("\n=== 6. Verifying Exemptions ===");
    console.log("Max wallet exempt:", await token.maxWalletExempt(VESTING_ADDRESS));
    console.log("Max tx exempt:", await token.maxTxExempt(VESTING_ADDRESS));
    console.log("Fee exempt:", await token.feeExempt(VESTING_ADDRESS));
    console.log("Anti-dump exempt:", await token.antiDumpExempt(VESTING_ADDRESS));
    
    console.log("\n=== 7. Attempting Transfer ===");
    
    try {
      console.log("Transferring", ethers.utils.formatEther(teamTokens), "tokens to vesting...");
      const transferTx = await token.transfer(VESTING_ADDRESS, teamTokens, {
        gasLimit: 500000
      });
      console.log("Transaction sent, waiting for confirmation...");
      await transferTx.wait();
      console.log("✅ Transfer successful!");
      
    } catch (transferError) {
      console.error("❌ Transfer failed:", transferError.message);
      
      // Try smaller amount
      console.log("\n=== 8. Trying Smaller Transfer ===");
      const smallAmount = maxWallet.div(2); // Half of max wallet
      console.log("Trying transfer of:", ethers.utils.formatEther(smallAmount));
      
      try {
        const smallTx = await token.transfer(VESTING_ADDRESS, smallAmount);
        await smallTx.wait();
        console.log("✅ Small transfer successful!");
      } catch (smallError) {
        console.error("❌ Small transfer also failed:", smallError.message);
      }
    }
    
    console.log("\n=== 9. Final Balances ===");
    console.log("Deployer Balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)));
    console.log("Vesting Balance:", ethers.utils.formatEther(await token.balanceOf(VESTING_ADDRESS)));
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    console.error("Full error:", error);
  }
}

if (require.main === module) {
  debugSepolia().catch(console.error);
}
