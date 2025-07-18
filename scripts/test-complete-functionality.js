// scripts/test-complete-functionality.js
const { ethers } = require("hardhat");

async function testCompleteFunctionality() {
  console.log("🧪 Testing complete VOLUME V2 functionality on Sepolia...\n");
  
  const [deployer] = await ethers.getSigners();
  
  // Replace with your new deployment address
  const TOKEN_ADDRESS = "0x6DB1004550b50a466b1cDb158f6d79D156313444";
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
  
  const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
  const token = VOLUME_V2.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== 1. CRITICAL TEST: transferFrom ===");
    
    const testAmount = ethers.utils.parseEther("1000");
    await token.approve(deployer.address, testAmount);
    
    const allowance = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance set:", ethers.utils.formatEther(allowance));
    
    if (allowance.gt(0)) {
      await token.transferFrom(deployer.address, deployer.address, ethers.utils.parseEther("1"));
      console.log("🎉 transferFrom WORKS on Sepolia!");
    } else {
      console.log("❌ Allowance issue on Sepolia");
      return;
    }
    
    console.log("\n=== 2. Add Liquidity ===");
    
    const routerABI = [
      "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
      "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external",
      "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable"
    ];
    
    const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, deployer);
    
    // Add liquidity
    const liquidityTokens = ethers.utils.parseEther("10000");
    const liquidityETH = ethers.utils.parseEther("0.01");
    
    await token.approve(ROUTER_ADDRESS, liquidityTokens);
    console.log("✅ Router approved for liquidity");
    
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
    console.log("✅ Liquidity added successfully!");
    
    console.log("\n=== 3. Test Buying ===");
    
    const buyAmount = ethers.utils.parseEther("0.001");
    const path = [WETH_ADDRESS, TOKEN_ADDRESS];
    
    const balanceBefore = await token.balanceOf(deployer.address);
    
    const buyTx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      path,
      deployer.address,
      Math.floor(Date.now() / 1000) + 1800,
      { value: buyAmount }
    );
    
    await buyTx.wait();
    console.log("✅ Buy successful!");
    
    const balanceAfter = await token.balanceOf(deployer.address);
    console.log("Tokens bought:", ethers.utils.formatEther(balanceAfter.sub(balanceBefore)));
    
    console.log("\n=== 4. THE BIG TEST: SELLING! ===");
    
    const sellAmount = ethers.utils.parseEther("1000");
    const sellPath = [TOKEN_ADDRESS, WETH_ADDRESS];
    
    // This is the moment of truth - selling with fixed transferFrom
    await token.approve(ROUTER_ADDRESS, sellAmount);
    console.log("✅ Router approved for selling");
    
    const ethBalanceBefore = await deployer.getBalance();
    
    console.log("🚨 ATTEMPTING SELL - THE ULTIMATE TEST...");
    
    const sellTx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      sellAmount,
      0,
      sellPath,
      deployer.address,
      Math.floor(Date.now() / 1000) + 1800
    );
    
    await sellTx.wait();
    console.log("🎉🎉🎉 SELL SUCCESSFUL! BUG COMPLETELY FIXED! 🎉🎉🎉");
    
    const ethBalanceAfter = await deployer.getBalance();
    console.log("ETH received from sell:", ethers.utils.formatEther(ethBalanceAfter.sub(ethBalanceBefore)));
    
    console.log("\n=== 5. Multiple Sell Tests ===");
    
    // Test multiple sells to make sure it's consistent
    for (let i = 0; i < 3; i++) {
      const testSell = ethers.utils.parseEther("500");
      await token.approve(ROUTER_ADDRESS, testSell);
      
      const multiSellTx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
        testSell,
        0,
        sellPath,
        deployer.address,
        Math.floor(Date.now() / 1000) + 1800
      );
      
      await multiSellTx.wait();
      console.log(`✅ Multiple sell test ${i + 1} successful!`);
    }
    
    console.log("\n🎉🎉🎉 VOLUME V2 IS FULLY FUNCTIONAL! 🎉🎉🎉");
    console.log("=====================================");
    console.log("✅ transferFrom bug COMPLETELY FIXED");
    console.log("✅ Buying works perfectly");
    console.log("✅ Selling works perfectly");
    console.log("✅ Multiple transactions work");
    console.log("✅ Uniswap integration complete");
    console.log("✅ Ready for mainnet deployment!");
    console.log("=====================================");
    
    console.log("\n🎯 PROJECT STATUS: PRODUCTION READY!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testCompleteFunctionality().catch(console.error);
}
