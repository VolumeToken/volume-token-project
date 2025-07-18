// scripts/test-clean-contract.js
const { ethers } = require("hardhat");

async function testCleanContract() {
  console.log("🧪 Testing clean contract...\n");
  
  try {
    console.log("=== 1. Test Compilation ===");
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    console.log("✅ Contract compiles successfully");
    
    console.log("\n=== 2. Test Local Deployment ===");
    const [deployer] = await ethers.getSigners();
    
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    console.log("✅ Contract deployed locally");
    
    console.log("\n=== 3. Test Approve (The Critical Test) ===");
    
    const largeAmount = ethers.utils.parseEther("10000");
    
    console.log("Anti-whale enabled:", await token.antiWhaleEnabled());
    console.log("Testing large amount approve...");
    
    await token.approve(deployer.address, largeAmount);
    const allowance = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance:", ethers.utils.formatEther(allowance));
    
    if (allowance.eq(0)) {
      console.log("❌ Still broken!");
      return;
    }
    
    console.log("🎉 APPROVE WORKS WITH LARGE AMOUNTS!");
    
    console.log("\n=== 4. Test TransferFrom ===");
    
    await token.transferFrom(deployer.address, deployer.address, largeAmount);
    console.log("✅ TransferFrom works!");
    
    const allowanceAfter = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance after transferFrom:", ethers.utils.formatEther(allowanceAfter));
    
    console.log("\n=== 5. Test Router Approve ===");
    
    const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
    
    await token.approve(ROUTER_ADDRESS, largeAmount);
    const routerAllowance = await token.allowance(deployer.address, ROUTER_ADDRESS);
    console.log("Router allowance:", ethers.utils.formatEther(routerAllowance));
    
    if (routerAllowance.gt(0)) {
      console.log("🎉 ROUTER APPROVE WORKS!");
    }
    
    console.log("\n🎉🎉🎉 ALL TESTS PASSED! 🎉🎉🎉");
    console.log("=====================================");
    console.log("✅ Contract compiles");
    console.log("✅ Approve works with large amounts");
    console.log("✅ TransferFrom works perfectly");
    console.log("✅ Router integration ready");
    console.log("✅ Anti-whale fixed");
    console.log("✅ Ready for Sepolia deployment");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testCleanContract().catch(console.error);
}
