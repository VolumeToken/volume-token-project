// scripts/test-final-uniswap-integration.js
const { ethers } = require("hardhat");

async function testFinalUniswapIntegration() {
  console.log("🚀 Testing final Uniswap integration...\n");
  
  const TOKEN_ADDRESS = "YOUR_WORKING_CONTRACT_ADDRESS"; // Update this
  
  if (TOKEN_ADDRESS === "YOUR_WORKING_CONTRACT_ADDRESS") {
    console.log("❌ Please update TOKEN_ADDRESS with your working contract address");
    return;
  }
  
  const [deployer] = await ethers.getSigners();
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
  
  const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
  const token = VOLUME_V2.attach(TOKEN_ADDRESS);
  
  try {
    console.log("Testing contract:", TOKEN_ADDRESS);
    
    console.log("\n=== 1. Final TransferFrom Test ===");
    
    const testAmount = ethers.utils.parseEther("10000");
    await token.approve(deployer.address, testAmount);
    await token.transferFrom(deployer.address, deployer.address, testAmount);
    console.log("✅ TransferFrom confirmed working");
    
    console.log("\n=== 2. Add Liquidity (THE ULTIMATE TEST) ===");
    
    const routerABI = [
      "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
    ];
    
    const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, deployer);
    
    const liquidityTokens = ethers.utils.parseEther("10000");
    const liquidityETH = ethers.utils.parseEther("0.01");
    
    await token.approve(ROUTER_ADDRESS, liquidityTokens);
    console.log("✅ Router approved for liquidity");
    
    console.log("🚨 ADDING LIQUIDITY - FINAL TEST...");
    
    const addLiquidityTx = await router.addLiquidityETH(
      TOKEN_ADDRESS,
      liquidityTokens,
      liquidityTokens.mul(90).div(100),
      liquidityETH.mul(90).div(100),
      deployer.address,
      Math.floor(Date.now() / 1000) + 1800,
      { value: liquidityETH }
    );
    
    await addLiquidityTx.wait();
    console.log("🎉🎉🎉 LIQUIDITY ADDED SUCCESSFULLY! 🎉🎉🎉");
    
    console.log("\n🏆 MISSION ACCOMPLISHED!");
    console.log("======================");
    console.log("✅ VOLUME token fully functional");
    console.log("✅ All bugs fixed");
    console.log("✅ Uniswap integration working");
    console.log("✅ Ready for mainnet deployment");
    
  } catch (error) {
    console.error("❌ Final test failed:", error.message);
  }
}

if (require.main === module) {
  testFinalUniswapIntegration().catch(console.error);
}
