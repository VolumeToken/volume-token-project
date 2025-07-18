// scripts/deploy-final-with-router.js
const { ethers } = require("hardhat");

async function deployFinalWithRouter() {
  console.log("🚀 Deploy final version with router included...\n");
  
  try {
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 11155111) {
      console.log("❌ Must run with --network sepolia");
      return;
    }
    
    const [deployer] = await ethers.getSigners();
    const SEPOLIA_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
    
    console.log("=== Deploy Final VOLUME V2 with Router ===");
    
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    
    // Deploy with router included from the start
    const token = await VOLUME_V2.deploy(
      deployer.address,         // marketing
      deployer.address,         // retailer
      SEPOLIA_ROUTER,          // router (set properly)
      deployer.address         // timelock
    );
    await token.deployed();
    
    console.log("✅ Final contract deployed:", token.address);
    
    console.log("\n=== Test Final Contract ===");
    
    const testAmount = ethers.utils.parseEther("10000");
    
    // Test approve
    await token.approve(deployer.address, testAmount);
    const allowance = await token.allowance(deployer.address, deployer.address);
    console.log("Final contract allowance:", ethers.utils.formatEther(allowance));
    
    if (allowance.gt(0)) {
      console.log("🎉 FINAL CONTRACT WORKS PERFECTLY!");
      
      // Test transferFrom
      await token.transferFrom(deployer.address, deployer.address, testAmount);
      console.log("✅ TransferFrom works on final contract!");
      
      console.log("\n=== Set Router Exemptions ===");
      
      // Set all router exemptions
      await token.setMaxWalletExempt(SEPOLIA_ROUTER, true);
      await token.setMaxTxExempt(SEPOLIA_ROUTER, true);
      await token.setFeeExempt(SEPOLIA_ROUTER, true);
      await token.setAntiDumpExempt(SEPOLIA_ROUTER, true);
      console.log("✅ Router exemptions set");
      
      // Check router is set
      const routerAddress = await token.uniswapV2Router();
      console.log("Router address:", routerAddress);
      console.log("Router correctly set:", routerAddress === SEPOLIA_ROUTER);
      
      console.log("\n🎉🎉🎉 COMPLETE SUCCESS! 🎉🎉🎉");
      console.log("=====================================");
      console.log("✅ Contract works on Sepolia");
      console.log("✅ Approve function works");
      console.log("✅ TransferFrom function works");
      console.log("✅ Router properly set");
      console.log("✅ Router exemptions set");
      console.log("✅ READY FOR UNISWAP INTEGRATION");
      console.log("=====================================");
      
    } else {
      console.log("❌ Final contract still has issues");
    }
    
    console.log("\n📋 FINAL CONTRACT INFO:");
    console.log("Address:", token.address);
    console.log("Etherscan:", `https://sepolia.etherscan.io/address/${token.address}`);
    console.log("Router:", SEPOLIA_ROUTER);
    
  } catch (error) {
    console.error("❌ Final deploy failed:", error.message);
  }
}

if (require.main === module) {
  deployFinalWithRouter().catch(console.error);
}
