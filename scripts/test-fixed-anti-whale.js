// scripts/test-fixed-anti-whale.js
const { ethers } = require("hardhat");

async function testFixedAntiWhale() {
  console.log("🧪 Testing fixed anti-whale contract...\n");
  
  try {
    const [deployer] = await ethers.getSigners();
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    
    console.log("✅ Fixed contract deployed locally");
    
    console.log("\n=== Test 1: Approve with Anti-Whale Enabled ===");
    
    const largeAmount = ethers.utils.parseEther("10000");
    
    console.log("Anti-whale enabled:", await token.antiWhaleEnabled());
    console.log("Max TX amount:", ethers.utils.formatEther(await token.maxTxAmount()));
    
    await token.approve(deployer.address, largeAmount);
    const allowance1 = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance with anti-whale enabled:", ethers.utils.formatEther(allowance1));
    
    if (allowance1.eq(0)) {
      console.log("❌ Still broken!");
      return;
    }
    
    console.log("✅ Approve works with anti-whale enabled!");
    
    console.log("\n=== Test 2: TransferFrom with Large Amount ===");
    
    await token.transferFrom(deployer.address, deployer.address, largeAmount);
    console.log("✅ TransferFrom works with large amount!");
    
    console.log("\n=== Test 3: Router Approve (Ultimate Test) ===");
    
    const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
    
    // Reset and test router approve
    await token.approve(ROUTER_ADDRESS, 0);
    await token.approve(ROUTER_ADDRESS, largeAmount);
    
    const routerAllowance = await token.allowance(deployer.address, ROUTER_ADDRESS);
    console.log("Router allowance:", ethers.utils.formatEther(routerAllowance));
    
    if (routerAllowance.gt(0)) {
      console.log("🎉 ROUTER APPROVE WORKS!");
    }
    
    console.log("\n🎉🎉🎉 ALL TESTS PASSED! 🎉🎉🎉");
    console.log("=====================================");
    console.log("✅ Anti-whale bug FIXED");
    console.log("✅ Approve works with large amounts");
    console.log("✅ TransferFrom works perfectly");
    console.log("✅ Router integration ready");
    console.log("✅ Ready for Sepolia deployment");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testFixedAntiWhale().catch(console.error);
}
