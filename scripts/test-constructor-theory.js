// scripts/test-constructor-theory.js
const { ethers } = require("hardhat");

async function testConstructorTheory() {
  console.log("🧪 Testing constructor parameter theory...\n");
  
  try {
    const [deployer] = await ethers.getSigners();
    const SEPOLIA_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    
    console.log("=== Test A: With Zero Address Router (WORKING) ===");
    
    const tokenA = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero, // Zero address
      deployer.address
    );
    await tokenA.deployed();
    
    const testAmount = ethers.utils.parseEther("10000");
    await tokenA.approve(deployer.address, testAmount);
    const allowanceA = await tokenA.allowance(deployer.address, deployer.address);
    console.log("Zero router allowance:", ethers.utils.formatEther(allowanceA));
    
    console.log("\n=== Test B: With Real Router Address (FAILING?) ===");
    
    const tokenB = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      SEPOLIA_ROUTER, // Real router address
      deployer.address
    );
    await tokenB.deployed();
    
    await tokenB.approve(deployer.address, testAmount);
    const allowanceB = await tokenB.allowance(deployer.address, deployer.address);
    console.log("Real router allowance:", ethers.utils.formatEther(allowanceB));
    
    console.log("\n=== Test C: Check What Happens in Constructor ===");
    
    console.log("Token A state:");
    console.log("  Router set:", await tokenA.uniswapV2Router());
    console.log("  Pair set:", await tokenA.uniswapV2Pair());
    console.log("  Deployer exempt:", await tokenA.feeExempt(deployer.address));
    
    console.log("Token B state:");
    console.log("  Router set:", await tokenB.uniswapV2Router());
    console.log("  Pair set:", await tokenB.uniswapV2Pair());
    console.log("  Deployer exempt:", await tokenB.feeExempt(deployer.address));
    
    if (allowanceA.gt(0) && allowanceB.eq(0)) {
      console.log("\n🎯 FOUND THE BUG!");
      console.log("The issue is with setting a real router address in constructor");
      console.log("This might be triggering pair creation or some other logic");
    }
    
    console.log("\n=== Test D: Check Pair Creation ===");
    
    // The constructor might be trying to create a pair when router is set
    const pairA = await tokenA.uniswapV2Pair();
    const pairB = await tokenB.uniswapV2Pair();
    
    console.log("Pair A (zero router):", pairA);
    console.log("Pair B (real router):", pairB);
    
    if (pairB !== ethers.constants.AddressZero) {
      console.log("🔍 Real router created a pair automatically!");
      console.log("This might be causing the approve issue");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testConstructorTheory().catch(console.error);
}
