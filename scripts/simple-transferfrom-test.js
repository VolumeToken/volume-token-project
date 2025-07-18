// scripts/simple-transferfrom-test.js
const { ethers } = require("hardhat");

async function simpleTest() {
  console.log("🧪 Simple transferFrom test...\n");
  
  try {
    console.log("=== Testing OpenZeppelin ERC20 Default ===");
    
    // Use the standard ERC20 from OpenZeppelin to confirm transferFrom works
    const [deployer] = await ethers.getSigners();
    
    // Create a basic contract inline
    console.log("Creating basic ERC20...");
    
    // This should work with default transferFrom
    const basicTokenFactory = await ethers.getContractFactory("contracts/TestBasicERC20.sol:TestBasicERC20");
    
  } catch (error) {
    console.log("Can't test with separate contract. Let's check what we have:");
    
    try {
      // Try to use VOLUME_V2 as is
      const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
      console.log("✅ VOLUME_V2 factory works");
      
      const [deployer] = await ethers.getSigners();
      const token = await VOLUME_V2.deploy(
        deployer.address,
        deployer.address,
        ethers.constants.AddressZero,
        deployer.address
      );
      await token.deployed();
      console.log("✅ VOLUME_V2 deployed locally");
      
      // Check if it has approve
      await token.approve(deployer.address, ethers.utils.parseEther("1000"));
      console.log("✅ Approve works");
      
      const allowance = await token.allowance(deployer.address, deployer.address);
      console.log("Allowance:", ethers.utils.formatEther(allowance));
      
      if (allowance.gt(0)) {
        // Try transferFrom
        await token.transferFrom(deployer.address, deployer.address, ethers.utils.parseEther("1"));
        console.log("🎉 transferFrom works!");
      }
      
    } catch (v2Error) {
      console.error("❌ VOLUME_V2 test failed:", v2Error.message);
    }
  }
}

if (require.main === module) {
  simpleTest().catch(console.error);
}
