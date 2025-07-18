// scripts/check-v2-compilation.js
const { ethers } = require("hardhat");

async function checkV2Compilation() {
  console.log("🔍 Checking VOLUME_V2 compilation...\n");
  
  try {
    console.log("=== 1. Check Contract Factory ===");
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    console.log("✅ VOLUME_V2 factory created successfully");
    
    console.log("\n=== 2. Check Contract Bytecode ===");
    const bytecode = VOLUME_V2.bytecode;
    console.log("Bytecode length:", bytecode.length);
    
    // Check if transferFrom is in the bytecode
    if (bytecode.includes("transferFrom")) {
      console.log("✅ transferFrom function found in bytecode");
    } else {
      console.log("❌ transferFrom function NOT found in bytecode");
    }
    
    console.log("\n=== 3. Check Contract Interface ===");
    const interface = VOLUME_V2.interface;
    const transferFromFunction = interface.getFunction("transferFrom");
    console.log("transferFrom function:", transferFromFunction);
    
    console.log("\n=== 4. Test Local Deployment ===");
    const [deployer] = await ethers.getSigners();
    
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address, 
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    console.log("✅ VOLUME_V2 deployed locally:", token.address);
    
    // Test transferFrom on local deployment
    const testAmount = ethers.utils.parseEther("1000");
    await token.approve(deployer.address, testAmount);
    await token.transferFrom(deployer.address, deployer.address, ethers.utils.parseEther("1"));
    console.log("✅ transferFrom works on local deployment!");
    
  } catch (error) {
    console.error("❌ V2 compilation check failed:", error.message);
    
    if (error.message.includes("No contract named")) {
      console.log("\n🔧 VOLUME_V2 contract not found!");
      console.log("Check if contracts/VOLUME_V2.sol exists");
    }
  }
}

if (require.main === module) {
  checkV2Compilation().catch(console.error);
}
