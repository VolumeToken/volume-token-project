// scripts/fix-router-exemptions-final.js
const { ethers } = require("hardhat");

async function fixRouterExemptions() {
  console.log("🔧 Fixing router exemptions (final fix)...\n");
  
  // REPLACE WITH YOUR CONTRACT ADDRESS
  const TOKEN_ADDRESS = "0x6DB1004550b50a466b1cDb158f6d79D156313444";
  
  const [deployer] = await ethers.getSigners();
  const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
  const token = VOLUME_V2.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== Setting All Router Exemptions ===");
    
    const addresses = [
      "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008", // Sepolia Router
      "0x7E0987E5b3a30e3f2828572Bb659A548460a3003", // Sepolia Factory
      "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9", // Sepolia WETH
      deployer.address, // Deployer
    ];
    
    for (const addr of addresses) {
      console.log(`Exempting ${addr}...`);
      
      await token.setMaxWalletExempt(addr, true);
      await token.setMaxTxExempt(addr, true);
      await token.setFeeExempt(addr, true);
      await token.setAntiDumpExempt(addr, true);
      
      console.log(`✅ ${addr} fully exempted`);
    }
    
    // Also exempt the pair
    const pairAddress = await token.uniswapV2Pair();
    console.log(`\nPair address: ${pairAddress}`);
    
    if (pairAddress !== ethers.constants.AddressZero) {
      console.log("Exempting pair...");
      await token.setMaxWalletExempt(pairAddress, true);
      await token.setMaxTxExempt(pairAddress, true);
      await token.setFeeExempt(pairAddress, true);
      await token.setAntiDumpExempt(pairAddress, true);
      console.log("✅ Pair fully exempted");
    }
    
    console.log("\n🎉 All exemptions set!");
    console.log("✅ Router can now receive unlimited tokens");
    console.log("✅ Router can now make unlimited transactions");
    console.log("✅ Router is exempt from all fees");
    console.log("✅ Router is exempt from anti-dump");
    
    console.log("\n🚀 Now run the complete functionality test again!");
    
  } catch (error) {
    console.error("❌ Failed to set exemptions:", error.message);
  }
}

if (require.main === module) {
  fixRouterExemptions().catch(console.error);
}
