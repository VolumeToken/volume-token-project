// scripts/test-both-networks.js
const { ethers } = require("hardhat");

async function testBothNetworks() {
  console.log("🧪 Testing to confirm network theory...\n");
  
  try {
    const network = await ethers.provider.getNetwork();
    const [deployer] = await ethers.getSigners();
    
    console.log("Current network:", network.name, "(Chain ID:", network.chainId + ")");
    console.log("Deployer:", deployer.address);
    console.log("ETH balance:", ethers.utils.formatEther(await deployer.getBalance()));
    
    console.log("\n=== Deploy and Test on Current Network ===");
    
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    
    // Exact same deployment as failing script
    const SEPOLIA_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
    
    const localToken = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero, // Start with zero to isolate issue
      deployer.address
    );
    await localToken.deployed();
    
    console.log("Contract deployed on", network.name + ":", localToken.address);
    
    const testAmount = ethers.utils.parseEther("10000");
    console.log("Testing approve with", ethers.utils.formatEther(testAmount), "tokens...");
    
    // Test approve
    await localToken.approve(deployer.address, testAmount);
    const localAllowance = await localToken.allowance(deployer.address, deployer.address);
    
    console.log("Result - Allowance:", ethers.utils.formatEther(localAllowance));
    
    if (localAllowance.eq(0)) {
      console.log("❌ APPROVE FAILS ON", network.name.toUpperCase());
      
      if (network.chainId === 11155111) {
        console.log("\n🎯 FOUND THE ISSUE!");
        console.log("Your contract works on local hardhat network");
        console.log("But FAILS on Sepolia network");
        console.log("This suggests a Sepolia-specific issue");
      }
    } else {
      console.log("✅ Approve works on", network.name);
      
      // Test transferFrom too
      await localToken.transferFrom(deployer.address, deployer.address, testAmount);
      console.log("✅ TransferFrom also works on", network.name);
    }
    
    console.log("\n=== Instructions ===");
    console.log("Run this script with:");
    console.log("npx hardhat run scripts/test-both-networks.js          (local)");
    console.log("npx hardhat run scripts/test-both-networks.js --network sepolia  (sepolia)");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
    console.error("Full error:", error);
  }
}

if (require.main === module) {
  testBothNetworks().catch(console.error);
}
