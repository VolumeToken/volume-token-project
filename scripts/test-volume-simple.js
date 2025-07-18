// scripts/test-volume-simple.js
const { ethers } = require("hardhat");

async function testVolumeSimple() {
  console.log("🔍 Testing VOLUME contract with minimal setup...\n");
  
  const [deployer] = await ethers.getSigners();
  
  try {
    // Test with all addresses as deployer and no router
    console.log("=== Testing VOLUME with minimal parameters ===");
    
    const VOLUME = await ethers.getContractFactory("VOLUME");
    const token = await VOLUME.deploy(
      deployer.address, // marketing
      deployer.address, // retailer
      ethers.constants.AddressZero, // no router
      deployer.address  // use deployer as timelock for testing
    );
    
    await token.deployed();
    console.log("✅ VOLUME deployed successfully:", token.address);
    
    // Test basic functions
    console.log("Name:", await token.name());
    console.log("Symbol:", await token.symbol());
    console.log("Total Supply:", ethers.utils.formatEther(await token.totalSupply()));
    
  } catch (error) {
    console.error("❌ VOLUME deployment failed:", error.message);
    
    // Check if it's a specific constructor issue
    if (error.message.includes("function returned an unexpected amount of data")) {
      console.log("\n🔧 This suggests an issue in the VOLUME constructor");
      console.log("Possible causes:");
      console.log("1. Router address validation failing");
      console.log("2. Uniswap factory calls failing");
      console.log("3. OpenZeppelin contract issues");
      console.log("4. Constructor parameter validation");
    }
  }
}

if (require.main === module) {
  testVolumeSimple().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
