// scripts/debug-constructor-logic.js
const { ethers } = require("hardhat");

async function debugConstructorLogic() {
  console.log("🔍 Debugging constructor logic issue...\n");
  
  try {
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 11155111) {
      console.log("❌ Must run with --network sepolia");
      return;
    }
    
    const [deployer] = await ethers.getSigners();
    const SEPOLIA_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    
    console.log("=== Test 1: Zero Router (Working) ===");
    
    const tokenWorking = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero, // Zero router
      deployer.address
    );
    await tokenWorking.deployed();
    
    const testAmount = ethers.utils.parseEther("10000");
    await tokenWorking.approve(deployer.address, testAmount);
    const allowanceWorking = await tokenWorking.allowance(deployer.address, deployer.address);
    console.log("Zero router allowance:", ethers.utils.formatEther(allowanceWorking));
    
    console.log("\n=== Test 2: Real Router (Failing) ===");
    
    const tokenFailing = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      SEPOLIA_ROUTER, // Real router
      deployer.address
    );
    await tokenFailing.deployed();
    
    await tokenFailing.approve(deployer.address, testAmount);
    const allowanceFailing = await tokenFailing.allowance(deployer.address, deployer.address);
    console.log("Real router allowance:", ethers.utils.formatEther(allowanceFailing));
    
    console.log("\n=== Check Contract States ===");
    
    console.log("Working contract:");
    console.log("  Router:", await tokenWorking.uniswapV2Router());
    console.log("  Pair:", await tokenWorking.uniswapV2Pair());
    console.log("  Anti-whale:", await tokenWorking.antiWhaleEnabled());
    console.log("  Deployer exempt:", await tokenWorking.feeExempt(deployer.address));
    
    console.log("Failing contract:");
    console.log("  Router:", await tokenFailing.uniswapV2Router());
    console.log("  Pair:", await tokenFailing.uniswapV2Pair());
    console.log("  Anti-whale:", await tokenFailing.antiWhaleEnabled());
    console.log("  Deployer exempt:", await tokenFailing.feeExempt(deployer.address));
    
    console.log("\n=== Check if Constructor Creates Pair ===");
    
    // Check if pair was created automatically
    const pairWorking = await tokenWorking.uniswapV2Pair();
    const pairFailing = await tokenFailing.uniswapV2Pair();
    
    if (pairFailing !== ethers.constants.AddressZero) {
      console.log("🔍 FOUND IT: Real router created a pair in constructor!");
      console.log("This might be triggering some logic that breaks approve");
      
      // Check if the pair has any balance or state
      const pairBalance = await tokenFailing.balanceOf(pairFailing);
      console.log("Pair balance:", ethers.utils.formatEther(pairBalance));
    }
    
    console.log("\n=== Test with Manual Router Setting ===");
    
    console.log("Testing: Deploy with zero router, then set router manually");
    
    // Set router manually on working contract
    try {
      // This will fail if function doesn't exist, but that's fine
      await tokenWorking.setUniswapV2Router(SEPOLIA_ROUTER);
      console.log("Router set manually");
      
      // Test approve after setting router
      await tokenWorking.approve(deployer.address, 0); // Reset
      await tokenWorking.approve(deployer.address, testAmount);
      const allowanceAfterRouter = await tokenWorking.allowance(deployer.address, deployer.address);
      console.log("Allowance after setting router:", ethers.utils.formatEther(allowanceAfterRouter));
      
    } catch (error) {
      console.log("Manual router setting failed (function doesn't exist):", error.message);
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugConstructorLogic().catch(console.error);
}
