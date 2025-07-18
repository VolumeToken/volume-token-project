// scripts/test-transferfrom-fix.js
const { ethers } = require("hardhat");

async function testTransferFromFix() {
  console.log("🧪 Testing transferFrom fix...\n");
  
  const [deployer, user1] = await ethers.getSigners();
  
  try {
    // Deploy V2
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    console.log("✅ VOLUME_V2 deployed:", token.address);
    
    // Test transferFrom
    const testAmount = ethers.utils.parseEther("1000");
    
    await token.transfer(user1.address, testAmount.mul(2));
    await token.connect(user1).approve(deployer.address, testAmount);
    
    console.log("Testing transferFrom...");
    await token.transferFrom(user1.address, deployer.address, testAmount);
    console.log("✅ transferFrom works!");
    
    console.log("\n🎉 Bug is fixed!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testTransferFromFix().catch(console.error);
}
