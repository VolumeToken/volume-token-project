// scripts/debug-sell.js
const { ethers } = require("hardhat");

async function debugSell() {
  console.log("🔍 Debugging sell issue...\n");
  
  const [deployer] = await ethers.getSigners();
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== 1. Current Token State ===");
    const deployerBalance = await token.balanceOf(deployer.address);
    console.log("Deployer balance:", ethers.utils.formatEther(deployerBalance));
    console.log("Token owner:", await token.owner());
    
    console.log("\n=== 2. Anti-Dump Mechanism Check ===");
    try {
      const canSell = await token.canSell(deployer.address);
      console.log("Can deployer sell?", canSell);
    } catch (e) {
      console.log("canSell function not available or failed:", e.message);
    }
    
    console.log("\n=== 3. Check Trading Restrictions ===");
    try {
      const tradingEnabled = await token.tradingEnabled();
      console.log("Trading enabled:", tradingEnabled);
    } catch (e) {
      console.log("tradingEnabled function not available");
    }
    
    try {
      const isPaused = await token.paused();
      console.log("Token paused:", isPaused);
    } catch (e) {
      console.log("paused function not available");
    }
    
    console.log("\n=== 4. Check Anti-Dump Exemptions ===");
    console.log("Deployer anti-dump exempt:", await token.antiDumpExempt(deployer.address));
    console.log("Router anti-dump exempt:", await token.antiDumpExempt(ROUTER_ADDRESS));
    
    // Get pair address
    const pairAddress = await token.uniswapV2Pair();
    console.log("Pair address:", pairAddress);
    console.log("Pair anti-dump exempt:", await token.antiDumpExempt(pairAddress));
    
    console.log("\n=== 5. Check Recent Transactions ===");
    try {
      const lastBuyTime = await token.lastBuyTime(deployer.address);
      const currentTime = Math.floor(Date.now() / 1000);
      console.log("Last buy time:", lastBuyTime.toString());
      console.log("Current time:", currentTime);
      console.log("Time since last buy:", currentTime - lastBuyTime.toNumber(), "seconds");
      
      const cooldownPeriod = await token.antiDumpCooldown();
      console.log("Cooldown period:", cooldownPeriod.toString(), "seconds");
      console.log("Can sell after cooldown?", currentTime - lastBuyTime.toNumber() >= cooldownPeriod.toNumber());
    } catch (e) {
      console.log("Anti-dump timing functions not available:", e.message);
    }
    
    console.log("\n=== 6. Try Enabling Trading/Exemptions ===");
    
    try {
      // Enable trading if not enabled
      console.log("Enabling trading...");
      await token.enableTrading();
      console.log("✅ Trading enabled");
    } catch (e) {
      console.log("Enable trading failed or not needed:", e.message);
    }
    
    try {
      // Exempt deployer from anti-dump
      console.log("Exempting deployer from anti-dump...");
      await token.setAntiDumpExempt(deployer.address, true);
      console.log("✅ Deployer exempted from anti-dump");
    } catch (e) {
      console.log("Anti-dump exemption failed:", e.message);
    }
    
    try {
      // Exempt pair from anti-dump
      console.log("Exempting pair from anti-dump...");
      await token.setAntiDumpExempt(pairAddress, true);
      console.log("✅ Pair exempted from anti-dump");
    } catch (e) {
      console.log("Pair anti-dump exemption failed:", e.message);
    }
    
    console.log("\n=== 7. Try Small Sell Test ===");
    
    const sellAmount = ethers.utils.parseEther("10"); // Very small amount
    console.log("Attempting to sell:", ethers.utils.formatEther(sellAmount), "VOLUME");
    
    // Check if we have enough balance
    if (deployerBalance.lt(sellAmount)) {
      console.log("⚠️  Not enough balance for sell test");
      return;
    }
    
    // Approve router
    await token.approve(ROUTER_ADDRESS, sellAmount);
    console.log("✅ Router approved for small sell");
    
    // Try direct transferFrom (what the router does)
    try {
      console.log("Testing direct transferFrom...");
      await token.transferFrom(deployer.address, ROUTER_ADDRESS, sellAmount);
      console.log("✅ Direct transferFrom successful");
    } catch (transferError) {
      console.error("❌ Direct transferFrom failed:", transferError.message);
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugSell().catch(console.error);
}
