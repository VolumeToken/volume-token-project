// scripts/test-after-cleanup.js
const { ethers } = require("hardhat");

async function testAfterCleanup() {
  console.log("🧪 Testing after cleanup...\n");
  
  try {
    console.log("=== Check What Contracts Exist ===");
    
    // This should now only show VOLUME_V2
    try {
      const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
      console.log("✅ VOLUME_V2 found");
      console.log("Bytecode length:", VOLUME_V2.bytecode.length);
    } catch (error) {
      console.log("❌ VOLUME_V2 not found:", error.message);
    }
    
    // These should all fail now
    const contractsToCheck = ["VOLUME", "volume", "VOLUME_WORKING"];
    
    for (const contractName of contractsToCheck) {
      try {
        await ethers.getContractFactory(contractName);
        console.log(`⚠️  ${contractName} still exists - should be removed`);
      } catch (error) {
        console.log(`✅ ${contractName} properly removed`);
      }
    }
    
    console.log("\n=== Deploy Clean VOLUME_V2 ===");
    
    const [deployer] = await ethers.getSigners();
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    
    console.log("✅ Clean VOLUME_V2 deployed:", token.address);
    
    console.log("\n=== Test Clean Contract ===");
    
    const testAmount = ethers.utils.parseEther("1000");
    
    // This should now work!
    await token.approve(deployer.address, testAmount);
    const allowance = await token.allowance(deployer.address, deployer.address);
    console.log("Clean contract allowance:", ethers.utils.formatEther(allowance));
    
    if (allowance.gt(0)) {
      console.log("🎉🎉🎉 CLEANUP FIXED THE ISSUE! 🎉🎉🎉");
      console.log("The multiple contracts were causing conflicts!");
      
      // Test transferFrom
      await token.transferFrom(deployer.address, deployer.address, testAmount);
      console.log("✅ TransferFrom also works!");
      
      console.log("\n🏆 YOUR CLEAN CONTRACT IS READY!");
      console.log("Address:", token.address);
      
    } else {
      console.log("❌ Still has issues - need further debugging");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testAfterCleanup().catch(console.error);
}
