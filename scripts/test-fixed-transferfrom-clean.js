// scripts/test-fixed-transferfrom-clean.js
const { ethers } = require("hardhat");

async function testFixedTransferFromClean() {
  console.log("🧪 Testing fixed transferFrom (clean)...\n");
  
  try {
    console.log("=== 1. Clean Compile ===");
    
    // Use fully qualified name to avoid conflicts
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    console.log("✅ Contract compiled successfully");
    
    console.log("\n=== 2. Deploy and Test Locally ===");
    const [deployer] = await ethers.getSigners();
    
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    console.log("✅ Contract deployed locally");
    
    console.log("\n=== 3. Test TransferFrom with Large Amount ===");
    
    const largeAmount = ethers.utils.parseEther("10000");
    
    // Approve large amount
    await token.approve(deployer.address, largeAmount);
    const allowance = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance set:", ethers.utils.formatEther(allowance));
    
    // Try transferFrom with large amount
    await token.transferFrom(deployer.address, deployer.address, largeAmount);
    console.log("✅ Large amount transferFrom works!");
    
    // Check allowance after
    const allowanceAfter = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance after transfer:", ethers.utils.formatEther(allowanceAfter));
    
    console.log("\n🎉 Fixed transferFrom works! Ready for redeployment.");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testFixedTransferFromClean().catch(console.error);
}
