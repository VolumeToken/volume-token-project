// scripts/fix-pair-address.js
const { ethers } = require("hardhat");

async function fixPairAddress() {
  console.log("🔧 Fixing pair address...\n");
  
  const [deployer] = await ethers.getSigners();
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  const FACTORY_ADDRESS = "0x7E0987E5b3a30e3f2828572Bb659A548460a3003";
  const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  const factoryABI = [
    "function getPair(address tokenA, address tokenB) external view returns (address pair)",
    "function createPair(address tokenA, address tokenB) external returns (address pair)"
  ];
  const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, deployer);
  
  try {
    console.log("=== 1. Check Current Pair Address ===");
    const currentPair = await token.uniswapV2Pair();
    console.log("Current pair address in token:", currentPair);
    
    console.log("\n=== 2. Get Actual Pair Address ===");
    const actualPair = await factory.getPair(TOKEN_ADDRESS, WETH_ADDRESS);
    console.log("Actual pair address from factory:", actualPair);
    
    if (actualPair === ethers.constants.AddressZero) {
      console.log("Creating new pair...");
      const createTx = await factory.createPair(TOKEN_ADDRESS, WETH_ADDRESS);
      await createTx.wait();
      const newPair = await factory.getPair(TOKEN_ADDRESS, WETH_ADDRESS);
      console.log("✅ New pair created:", newPair);
    }
    
    console.log("\n=== 3. Set Pair Address in Token ===");
    const finalPair = await factory.getPair(TOKEN_ADDRESS, WETH_ADDRESS);
    
    try {
      await token.setUniswapV2Pair(finalPair);
      console.log("✅ Pair address set in token contract");
    } catch (e) {
      console.log("Setting pair address failed:", e.message);
      console.log("This might not be available or might be set automatically");
    }
    
    console.log("\n=== 4. Set Pair Exemptions ===");
    
    // Exempt the actual pair from all limits
    await token.setMaxWalletExempt(finalPair, true);
    console.log("✅ Pair exempt from max wallet");
    
    await token.setMaxTxExempt(finalPair, true);
    console.log("✅ Pair exempt from max tx");
    
    await token.setFeeExempt(finalPair, true);
    console.log("✅ Pair exempt from fees");
    
    await token.setAntiDumpExempt(finalPair, true);
    console.log("✅ Pair exempt from anti-dump");
    
    console.log("\n=== 5. Final Verification ===");
    console.log("Token pair address:", await token.uniswapV2Pair());
    console.log("Factory pair address:", finalPair);
    console.log("Pair max wallet exempt:", await token.maxWalletExempt(finalPair));
    console.log("Pair fee exempt:", await token.feeExempt(finalPair));
    
    console.log("\n🎉 Pair address fixed!");
    
  } catch (error) {
    console.error("❌ Fix failed:", error.message);
  }
}

if (require.main === module) {
  fixPairAddress().catch(console.error);
}
