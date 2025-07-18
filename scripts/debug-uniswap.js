// scripts/debug-uniswap.js
const { ethers } = require("hardhat");

async function debugUniswap() {
  console.log("🔍 Debugging Uniswap transfer issue...\n");
  
  const [deployer] = await ethers.getSigners();
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== 1. Token Status ===");
    console.log("Deployer balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)));
    console.log("Router balance:", ethers.utils.formatEther(await token.balanceOf(ROUTER_ADDRESS)));
    
    console.log("\n=== 2. Checking Limits ===");
    const maxWallet = await token.maxWalletAmount();
    const maxTx = await token.maxTxAmount();
    const liquidityTokens = ethers.utils.parseEther("10000");
    
    console.log("Max Wallet:", ethers.utils.formatEther(maxWallet));
    console.log("Max TX:", ethers.utils.formatEther(maxTx));
    console.log("Liquidity amount:", ethers.utils.formatEther(liquidityTokens));
    console.log("Amount > Max Wallet?", liquidityTokens.gt(maxWallet));
    console.log("Amount > Max TX?", liquidityTokens.gt(maxTx));
    
    console.log("\n=== 3. Checking Router Exemptions ===");
    console.log("Router max wallet exempt:", await token.maxWalletExempt(ROUTER_ADDRESS));
    console.log("Router max tx exempt:", await token.maxTxExempt(ROUTER_ADDRESS));
    console.log("Router fee exempt:", await token.feeExempt(ROUTER_ADDRESS));
    
    console.log("\n=== 4. Checking Allowance ===");
    const allowance = await token.allowance(deployer.address, ROUTER_ADDRESS);
    console.log("Router allowance:", ethers.utils.formatEther(allowance));
    console.log("Allowance >= liquidity amount?", allowance.gte(liquidityTokens));
    
    console.log("\n=== 5. Testing Direct Transfer to Router ===");
    try {
      const testAmount = ethers.utils.parseEther("1000"); // Smaller amount
      console.log("Attempting direct transfer of", ethers.utils.formatEther(testAmount), "to router...");
      
      const transferTx = await token.transfer(ROUTER_ADDRESS, testAmount);
      await transferTx.wait();
      console.log("✅ Direct transfer successful!");
      console.log("Router balance after:", ethers.utils.formatEther(await token.balanceOf(ROUTER_ADDRESS)));
      
    } catch (transferError) {
      console.error("❌ Direct transfer failed:", transferError.message);
    }
    
    console.log("\n=== 6. Setting Router Exemptions ===");
    
    try {
      console.log("Setting max wallet exemption for router...");
      await token.setMaxWalletExempt(ROUTER_ADDRESS, true);
      console.log("✅ Max wallet exemption set");
      
      console.log("Setting max tx exemption for router...");
      await token.setMaxTxExempt(ROUTER_ADDRESS, true);
      console.log("✅ Max tx exemption set");
      
      console.log("Setting fee exemption for router...");
      await token.setFeeExempt(ROUTER_ADDRESS, true);
      console.log("✅ Fee exemption set");
      
      console.log("Setting anti-dump exemption for router...");
      await token.setAntiDumpExempt(ROUTER_ADDRESS, true);
      console.log("✅ Anti-dump exemption set");
      
      console.log("\n=== 7. Verifying Exemptions ===");
      console.log("Router max wallet exempt:", await token.maxWalletExempt(ROUTER_ADDRESS));
      console.log("Router max tx exempt:", await token.maxTxExempt(ROUTER_ADDRESS));
      console.log("Router fee exempt:", await token.feeExempt(ROUTER_ADDRESS));
      console.log("Router anti-dump exempt:", await token.antiDumpExempt(ROUTER_ADDRESS));
      
    } catch (exemptionError) {
      console.error("❌ Error setting exemptions:", exemptionError.message);
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugUniswap().catch(console.error);
}
