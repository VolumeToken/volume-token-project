// scripts/debug-inconsistent-behavior.js
const { ethers } = require("hardhat");

async function debugInconsistentBehavior() {
  console.log("🔍 Debugging inconsistent behavior between scripts...\n");
  
  try {
    const [deployer] = await ethers.getSigners();
    
    console.log("=== Test 1: Same as test-clean-contract (WORKING) ===");
    
    const VOLUME_V2_1 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    const token1 = await VOLUME_V2_1.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token1.deployed();
    
    const largeAmount = ethers.utils.parseEther("10000");
    await token1.approve(deployer.address, largeAmount);
    const allowance1 = await token1.allowance(deployer.address, deployer.address);
    console.log("Test 1 allowance:", ethers.utils.formatEther(allowance1));
    
    console.log("\n=== Test 2: Same as deploy-clean-final (FAILING) ===");
    
    const VOLUME_V2_2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    const localToken = await VOLUME_V2_2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await localToken.deployed();
    
    const testAmount = ethers.utils.parseEther("10000");
    await localToken.approve(deployer.address, testAmount);
    const localAllowance = await localToken.allowance(deployer.address, deployer.address);
    console.log("Test 2 allowance:", ethers.utils.formatEther(localAllowance));
    
    console.log("\n=== Test 3: Exact Same Variables ===");
    
    const VOLUME_V2_3 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    const token3 = await VOLUME_V2_3.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token3.deployed();
    
    // Use exact same variable names as failing script
    const testAmount3 = ethers.utils.parseEther("10000");
    await token3.approve(deployer.address, testAmount3);
    const localAllowance3 = await token3.allowance(deployer.address, deployer.address);
    console.log("Test 3 allowance:", ethers.utils.formatEther(localAllowance3));
    
    console.log("\n=== Test 4: With Router Address (Deploy Script Style) ===");
    
    const SEPOLIA_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
    
    const VOLUME_V2_4 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    const token4 = await VOLUME_V2_4.deploy(
      deployer.address,
      deployer.address,
      SEPOLIA_ROUTER, // This is different!
      deployer.address
    );
    await token4.deployed();
    
    const testAmount4 = ethers.utils.parseEther("10000");
    await token4.approve(deployer.address, testAmount4);
    const localAllowance4 = await token4.allowance(deployer.address, deployer.address);
    console.log("Test 4 allowance (with router):", ethers.utils.formatEther(localAllowance4));
    
    console.log("\n=== ANALYSIS ===");
    
    if (allowance1.gt(0) && localAllowance.eq(0)) {
      console.log("🔍 FOUND DIFFERENCE: Something about the second script context");
    }
    
    if (localAllowance4.eq(0) && allowance1.gt(0)) {
      console.log("🔍 FOUND IT: Router address in constructor is causing the issue!");
    }
    
    console.log("\n=== Test 5: Check Contract State Differences ===");
    
    console.log("Contract 1 (working):");
    console.log("  Router:", await token1.uniswapV2Router());
    console.log("  Pair:", await token1.uniswapV2Pair());
    console.log("  Anti-whale:", await token1.antiWhaleEnabled());
    
    console.log("Contract 4 (failing):");
    console.log("  Router:", await token4.uniswapV2Router());
    console.log("  Pair:", await token4.uniswapV2Pair());
    console.log("  Anti-whale:", await token4.antiWhaleEnabled());
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugInconsistentBehavior().catch(console.error);
}
