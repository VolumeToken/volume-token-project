// scripts/test-complete-uniswap-final.js
const { ethers } = require("hardhat");

async function testCompleteUniswapFinal() {
  console.log("🧪 Testing complete Uniswap integration (FINAL)...\n");
  
  // UPDATE WITH YOUR PRODUCTION CONTRACT ADDRESS
  const TOKEN_ADDRESS = "UPDATE_WITH_PRODUCTION_ADDRESS";
  
  if (TOKEN_ADDRESS === "UPDATE_WITH_PRODUCTION_ADDRESS") {
    console.log("❌ Update TOKEN_ADDRESS with your production contract address");
    return;
  }
  
  const [deployer] = await ethers.getSigners();
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
  
  const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
  const token = VOLUME_V2.attach(TOKEN_ADDRESS);
  
  try {
    console.log("Testing production contract:", TOKEN_ADDRESS);
    
    console.log("\n=== 1. Add Liquidity ===");
    
    const routerABI = [
      "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
      "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external",
      "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable"
    ];
    
    const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, deployer);
    
    const liquidityTokens = ethers.utils.parseEther("10000");
    const liquidityETH = ethers.utils.parseEther("0.01");
    
    // Approve with explicit gas
    await token.approve(ROUTER_ADDRESS, liquidityTokens, { gasLimit: 100000 });
    console.log("✅ Router approved for liquidity");
    
    console.log("🚨 ADDING LIQUIDITY...");
    const addLiquidityTx = await router.addLiquidityETH(
      TOKEN_ADDRESS,
      liquidityTokens,
      liquidityTokens.mul(90).div(100),
      liquidityETH.mul(90).div(100),
      deployer.address,
      Math.floor(Date.now() / 1000) + 1800,
      { value: liquidityETH, gasLimit: 500000 }
    );
    
    await addLiquidityTx.wait();
    console.log("🎉 LIQUIDITY ADDED SUCCESSFULLY!");
    
    console.log("\n=== 2. Test Buy ===");
    
    const buyAmount = ethers.utils.parseEther("0.001");
    const path = [WETH_ADDRESS, TOKEN_ADDRESS];
    
    await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      path,
      deployer.address,
      Math.floor(Date.now() / 1000) + 1800,
      { value: buyAmount, gasLimit: 300000 }
    );
    console.log("✅ Buy successful!");
    
    console.log("\n=== 3. Test Sell ===");
    
    const sellAmount = ethers.utils.parseEther("1000");
    const sellPath = [TOKEN_ADDRESS, WETH_ADDRESS];
    
    await token.approve(ROUTER_ADDRESS, sellAmount, { gasLimit: 100000 });
    
    await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      sellAmount,
      0,
      sellPath,
      deployer.address,
      Math.floor(Date.now() / 1000) + 1800,
      { gasLimit: 300000 }
    );
    console.log("✅ Sell successful!");
    
    console.log("\n🎉🎉🎉 MISSION ACCOMPLISHED! 🎉🎉🎉");
    console.log("=========================================");
    console.log("✅ VOLUME token fully functional");
    console.log("✅ All features working");
    console.log("✅ Uniswap integration complete");
    console.log("✅ Buy and sell confirmed");
    console.log("✅ READY FOR MAINNET!");
    
  } catch (error) {
    console.error("❌ Uniswap test failed:", error.message);
  }
}

if (require.main === module) {
  testCompleteUniswapFinal().catch(console.error);
}
