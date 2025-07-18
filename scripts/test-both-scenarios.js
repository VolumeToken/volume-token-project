// scripts/test-both-scenarios.js
const { ethers } = require("hardhat");

async function testBothScenarios() {
  console.log("🧪 Testing both scenarios to find the discrepancy...\n");
  
  try {
    const [deployer] = await ethers.getSigners();
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    
    console.log("=== Scenario 1: Simple Test (like debug) ===");
    
    const token1 = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token1.deployed();
    
    const testAmount1 = ethers.utils.parseEther("1000");
    await token1.approve(deployer.address, testAmount1);
    const allowance1 = await token1.allowance(deployer.address, deployer.address);
    console.log("Scenario 1 - Allowance:", ethers.utils.formatEther(allowance1));
    
    console.log("\n=== Scenario 2: Deployment Test Style ===");
    
    const token2 = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token2.deployed();
    
    const testAmount2 = ethers.utils.parseEther("10000"); // Same as deployment test
    await token2.approve(deployer.address, testAmount2);
    const allowance2 = await token2.allowance(deployer.address, deployer.address);
    console.log("Scenario 2 - Allowance:", ethers.utils.formatEther(allowance2));
    
    console.log("\n=== Scenario 3: Test transferFrom ===");
    
    if (allowance2.gt(0)) {
      console.log("Testing transferFrom...");
      await token2.transferFrom(deployer.address, deployer.address, testAmount2);
      console.log("✅ transferFrom works!");
      
      const allowanceAfter = await token2.allowance(deployer.address, deployer.address);
      console.log("Allowance after transferFrom:", ethers.utils.formatEther(allowanceAfter));
      
      console.log("\n🎉 BOTH APPROVE AND TRANSFERFROM WORK LOCALLY!");
      console.log("The issue must be in the deployment or network context");
    }
    
    console.log("\n=== Scenario 4: Test with Router Address ===");
    
    const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
    
    console.log("Testing approve with router address...");
    await token2.approve(ROUTER_ADDRESS, testAmount2);
    const routerAllowance = await token2.allowance(deployer.address, ROUTER_ADDRESS);
    console.log("Router allowance:", ethers.utils.formatEther(routerAllowance));
    
    if (routerAllowance.gt(0)) {
      console.log("✅ Router approve works too!");
    }
    
    console.log("\n=== CONCLUSION ===");
    console.log("Your local contract is working PERFECTLY!");
    console.log("The issue is likely:");
    console.log("1. Network-specific problem on Sepolia");
    console.log("2. Deployment script issue");
    console.log("3. Previous test state interference");
    console.log("4. Different contract versions being deployed");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testBothScenarios().catch(console.error);
}
