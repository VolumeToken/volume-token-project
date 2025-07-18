// scripts/fix-router-exemptions-v2.js
const { ethers } = require("hardhat");

async function fixRouterExemptions() {
  console.log("🔧 Fixing router exemptions for V2...\n");
  
  const TOKEN_ADDRESS = process.argv[2];
  if (!TOKEN_ADDRESS) {
    console.log("Usage: npx hardhat run scripts/fix-router-exemptions-v2.js --network sepolia 0xYourContractAddress");
    return;
  }
  
  const [deployer] = await ethers.getSigners();
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  const FACTORY_ADDRESS = "0x7E0987E5b3a30e3f2828572Bb659A548460a3003";
  const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
  
  const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
  const token = VOLUME_V2.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== Setting Complete Exemptions ===");
    
    // Exempt router from everything
    console.log("1. Exempting router...");
    await token.setMaxWalletExempt(ROUTER_ADDRESS, true);
    await token.setMaxTxExempt(ROUTER_ADDRESS, true);
    await token.setFeeExempt(ROUTER_ADDRESS, true);
    await token.setAntiDumpExempt(ROUTER_ADDRESS, true);
    console.log("✅ Router exempted");
    
    // Exempt factory
    console.log("2. Exempting factory...");
    await token.setMaxWalletExempt(FACTORY_ADDRESS, true);
    await token.setMaxTxExempt(FACTORY_ADDRESS, true);
    await token.setFeeExempt(FACTORY_ADDRESS, true);
    await token.setAntiDumpExempt(FACTORY_ADDRESS, true);
    console.log("✅ Factory exempted");
    
    // Exempt WETH
    console.log("3. Exempting WETH...");
    await token.setMaxWalletExempt(WETH_ADDRESS, true);
    await token.setMaxTxExempt(WETH_ADDRESS, true);
    await token.setFeeExempt(WETH_ADDRESS, true);
    await token.setAntiDumpExempt(WETH_ADDRESS, true);
    console.log("✅ WETH exempted");
    
    // Exempt pair
    console.log("4. Exempting pair...");
    const pairAddress = await token.uniswapV2Pair();
    console.log("Pair address:", pairAddress);
    
    if (pairAddress !== ethers.constants.AddressZero) {
      await token.setMaxWalletExempt(pairAddress, true);
      await token.setMaxTxExempt(pairAddress, true);
      await token.setFeeExempt(pairAddress, true);
      await token.setAntiDumpExempt(pairAddress, true);
      console.log("✅ Pair exempted");
    } else {
      console.log("⚠️  Pair address is zero - may need to be set");
    }
    
    // Exempt deployer (just in case)
    console.log("5. Exempting deployer...");
    await token.setMaxWalletExempt(deployer.address, true);
    await token.setMaxTxExempt(deployer.address, true);
    await token.setFeeExempt(deployer.address, true);
    await token.setAntiDumpExempt(deployer.address, true);
    console.log("✅ Deployer exempted");
    
    console.log("\n🎉 All exemptions set! Try the liquidity test again.");
    
  } catch (error) {
    console.error("❌ Failed to set exemptions:", error.message);
  }
}

if (require.main === module) {
  fixRouterExemptions().catch(console.error);
}
