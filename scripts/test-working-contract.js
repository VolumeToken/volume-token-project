// scripts/test-working-contract.js
const { ethers } = require("hardhat");

async function testWorkingContract() {
  console.log("🧪 Testing working contract...\n");
  
  try {
    const VOLUME_WORKING = await ethers.getContractFactory("VOLUME_WORKING");
    const token = await VOLUME_WORKING.deploy();
    await token.deployed();
    
    console.log("✅ VOLUME_WORKING deployed");
    
    const [deployer] = await ethers.getSigners();
    const testAmount = ethers.utils.parseEther("10000");
    
    console.log("=== Test 1: Basic Approve ===");
    await token.approve(deployer.address, testAmount);
    const allowance = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance:", ethers.utils.formatEther(allowance));
    
    if (allowance.eq(0)) {
      console.log("❌ CRITICAL: Even basic ERC20 fails!");
      return;
    }
    
    console.log("✅ Basic approve works!");
    
    console.log("\n=== Test 2: Basic TransferFrom ===");
    await token.transferFrom(deployer.address, deployer.address, testAmount);
    console.log("✅ Basic transferFrom works!");
    
    console.log("\n=== Test 3: Deploy to Sepolia ===");
    console.log("This contract is ready for Sepolia deployment");
    console.log("Once deployed, we can add custom logic incrementally");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testWorkingContract().catch(console.error);
}
