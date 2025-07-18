// scripts/deploy-and-test-complete.js
const { ethers } = require("hardhat");

async function deployAndTestComplete() {
  console.log("🚀 Complete deploy and test process...\n");
  
  const [deployer] = await ethers.getSigners();
  const SEPOLIA_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  
  try {
    console.log("=== 1. Final Local Test ===");
    
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    
    // Test locally first
    const localToken = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await localToken.deployed();
    
    const testAmount = ethers.utils.parseEther("10000");
    
    // Test approve
    await localToken.approve(deployer.address, testAmount);
    const localAllowance = await localToken.allowance(deployer.address, deployer.address);
    console.log("Local allowance:", ethers.utils.formatEther(localAllowance));
    
    if (localAllowance.eq(0)) {
      console.log("❌ Local test failed - stopping");
      return;
    }
    
    // Test transferFrom
    await localToken.transferFrom(deployer.address, deployer.address, testAmount);
    console.log("✅ Local test passed completely!");
    
    console.log("\n=== 2. Deploy to Sepolia ===");
    
    const sepoliaToken = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      SEPOLIA_ROUTER,
      deployer.address
    );
    await sepoliaToken.deployed();
    
    console.log("✅ Deployed to Sepolia:", sepoliaToken.address);
    
    console.log("\n=== 3. Test Sepolia Deployment ===");
    
    // Test approve on Sepolia
    await sepoliaToken.approve(deployer.address, testAmount);
    const sepoliaAllowance = await sepoliaToken.allowance(deployer.address, deployer.address);
    console.log("Sepolia allowance:", ethers.utils.formatEther(sepoliaAllowance));
    
    if (sepoliaAllowance.eq(0)) {
      console.log("❌ Sepolia approve failed");
      return;
    }
    
    // Test transferFrom on Sepolia
    await sepoliaToken.transferFrom(deployer.address, deployer.address, testAmount);
    console.log("✅ Sepolia transferFrom works!");
    
    console.log("\n=== 4. Set Up for Uniswap ===");
    
    // Set exemptions
    await sepoliaToken.setMaxWalletExempt(SEPOLIA_ROUTER, true);
    await sepoliaToken.setMaxTxExempt(SEPOLIA_ROUTER, true);
    await sepoliaToken.setFeeExempt(SEPOLIA_ROUTER, true);
    await sepoliaToken.setAntiDumpExempt(SEPOLIA_ROUTER, true);
    console.log("✅ Router exemptions set");
    
    console.log("\n🎉 COMPLETE SUCCESS!");
    console.log("========================");
    console.log("✅ Local tests pass");
    console.log("✅ Sepolia deployment works");
    console.log("✅ Sepolia approve works");
    console.log("✅ Sepolia transferFrom works");
    console.log("✅ Router exemptions set");
    console.log("✅ Ready for Uniswap testing");
    
    console.log("\n📋 Contract Address:");
    console.log(sepoliaToken.address);
    console.log("🔗 Etherscan:", `https://sepolia.etherscan.io/address/${sepoliaToken.address}`);
    
  } catch (error) {
    console.error("❌ Deploy and test failed:", error.message);
  }
}

if (require.main === module) {
  deployAndTestComplete().catch(console.error);
}
