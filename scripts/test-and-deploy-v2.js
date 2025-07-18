// scripts/test-and-deploy-v2.js
const { ethers } = require("hardhat");

async function testAndDeployV2() {
  console.log("🧪 Testing and deploying VOLUME_V2...\n");
  
  try {
    console.log("=== 1. Test Compilation ===");
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    console.log("✅ VOLUME_V2 compiled successfully");
    
    // Check bytecode
    const bytecode = VOLUME_V2.bytecode;
    const hasTransferFrom = bytecode.includes('23b872dd'); // transferFrom selector
    console.log("transferFrom in bytecode:", hasTransferFrom);
    
    if (!hasTransferFrom) {
      console.log("❌ transferFrom still missing from bytecode!");
      return;
    }
    
    console.log("\n=== 2. Test Locally ===");
    const [deployer] = await ethers.getSigners();
    
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    console.log("✅ Local deployment successful");
    
    // Test transferFrom
    await token.approve(deployer.address, ethers.utils.parseEther("1000"));
    await token.transferFrom(deployer.address, deployer.address, ethers.utils.parseEther("1"));
    console.log("✅ transferFrom works locally!");
    
    console.log("\n=== 3. Ready for Sepolia Deployment ===");
    console.log("Run: npx hardhat run scripts/deploy-v2.js --network sepolia");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testAndDeployV2().catch(console.error);
}
