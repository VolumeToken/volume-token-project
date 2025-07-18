// scripts/test-trading-complete.js - FIXED
const { ethers } = require("hardhat");

async function testTradingComplete() {
  console.log("💰 Testing complete trading functionality...\n");
  
  const signers = await ethers.getSigners();
  const deployer = signers[0];
  const user1 = signers[1] || deployer; // Use deployer if not enough signers
  const user2 = signers[2] || deployer;
  
  console.log("Deployer:", deployer.address);
  console.log("User1:", user1.address);
  console.log("User2:", user2.address);
  
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  const routerABI = [
    "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable",
    "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external",
    "function getAmountsOut(uint amountIn, address[] calldata path) external view returns (uint[] memory amounts)"
  ];
  const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, deployer);
  
  try {
    console.log("\n=== 1. Test Buy (ETH -> VOLUME) ===");
    
    const buyAmount = ethers.utils.parseEther("0.001"); // 0.001 ETH
    const path = [WETH_ADDRESS, TOKEN_ADDRESS];
    const deadline = Math.floor(Date.now() / 1000) + 1800;
    
    console.log("Buy amount (ETH):", ethers.utils.formatEther(buyAmount));
    console.log("Path:", path);
    
    // Get expected output
    const amountsOut = await router.getAmountsOut(buyAmount, path);
    console.log("Expected VOLUME tokens:", ethers.utils.formatEther(amountsOut[1]));
    
    const balanceBefore = await token.balanceOf(user1.address);
    const ethBalanceBefore = await user1.getBalance();
    
    console.log("User1 VOLUME balance before:", ethers.utils.formatEther(balanceBefore));
    console.log("User1 ETH balance before:", ethers.utils.formatEther(ethBalanceBefore));
    
    // Check if user1 has enough ETH
    if (ethBalanceBefore.lt(buyAmount)) {
      console.log("⚠️  User1 doesn't have enough ETH, using deployer instead");
      const deployerBalance = await deployer.getBalance();
      console.log("Deployer ETH balance:", ethers.utils.formatEther(deployerBalance));
    }
    
    // Buy tokens (use deployer if user1 doesn't have enough ETH)
    const buyer = ethBalanceBefore.gt(buyAmount.mul(2)) ? user1 : deployer;
    console.log("Buying with account:", buyer.address);
    
    const buyTx = await router.connect(buyer).swapExactETHForTokensSupportingFeeOnTransferTokens(
      amountsOut[1].mul(90).div(100), // 10% slippage
      path,
      buyer.address,
      deadline,
      { value: buyAmount }
    );
    
    console.log("Buy transaction sent:", buyTx.hash);
    await buyTx.wait();
    console.log("✅ Buy transaction successful!");
    
    const balanceAfter = await token.balanceOf(buyer.address);
    const tokensBought = balanceAfter.sub(await token.balanceOf(buyer.address) === buyer.address ? balanceBefore : 0);
    
    console.log("Buyer balance after:", ethers.utils.formatEther(balanceAfter));
    console.log("Tokens received:", ethers.utils.formatEther(tokensBought));
    
    console.log("\n=== 2. Test Sell (VOLUME -> ETH) ===");
    
    // Use a small amount to sell
    const sellAmount = ethers.utils.parseEther("100"); // 100 VOLUME tokens
    const sellPath = [TOKEN_ADDRESS, WETH_ADDRESS];
    
    console.log("Attempting to sell:", ethers.utils.formatEther(sellAmount), "VOLUME");
    
    // Make sure buyer has enough tokens
    if (balanceAfter.lt(sellAmount)) {
      console.log("⚠️  Not enough tokens to sell, transferring some first...");
      // Transfer tokens from deployer to buyer
      const deployerBalance = await token.balanceOf(deployer.address);
      if (deployerBalance.gt(sellAmount)) {
        await token.transfer(buyer.address, sellAmount);
        console.log("✅ Tokens transferred for selling");
      } else {
        console.log("⚠️  Even deployer doesn't have enough tokens, skipping sell test");
        return;
      }
    }
    
    // Approve router
    await token.connect(buyer).approve(ROUTER_ADDRESS, sellAmount);
    console.log("✅ Router approved for selling");
    
    const ethBalanceBeforeSell = await buyer.getBalance();
    
    // Sell tokens
    const sellTx = await router.connect(buyer).swapExactTokensForETHSupportingFeeOnTransferTokens(
      sellAmount,
      0, // Accept any amount of ETH
      sellPath,
      buyer.address,
      deadline
    );
    
    console.log("Sell transaction sent:", sellTx.hash);
    await sellTx.wait();
    console.log("✅ Sell transaction successful!");
    
    const ethBalanceAfterSell = await buyer.getBalance();
    const finalTokenBalance = await token.balanceOf(buyer.address);
    
    console.log("ETH received:", ethers.utils.formatEther(ethBalanceAfterSell.sub(ethBalanceBeforeSell)));
    console.log("Final VOLUME balance:", ethers.utils.formatEther(finalTokenBalance));
    
    console.log("\n=== 3. Test Fee Collection ===");
    const marketingWallet = await token.marketingMultisig();
    const marketingBalance = await token.balanceOf(marketingWallet);
    console.log("Marketing wallet:", marketingWallet);
    console.log("Marketing wallet balance:", ethers.utils.formatEther(marketingBalance));
    
    console.log("\n=== 4. Test Anti-whale Limits ===");
    console.log("Max wallet amount:", ethers.utils.formatEther(await token.maxWalletAmount()));
    console.log("Max tx amount:", ethers.utils.formatEther(await token.maxTxAmount()));
    
    console.log("\n=== 5. Price Impact Test ===");
    const smallBuy = ethers.utils.parseEther("0.0001");
    const largeBuy = ethers.utils.parseEther("0.01");
    
    try {
      const smallAmounts = await router.getAmountsOut(smallBuy, path);
      const largeAmounts = await router.getAmountsOut(largeBuy, path);
      
      console.log("Small buy (0.0001 ETH):", ethers.utils.formatEther(smallAmounts[1]), "VOLUME");
      console.log("Large buy (0.01 ETH):", ethers.utils.formatEther(largeAmounts[1]), "VOLUME");
      
      const priceImpact = largeAmounts[1].mul(10).div(smallAmounts[1].mul(100));
      console.log("Price impact ratio:", priceImpact.toString());
      
    } catch (priceError) {
      console.log("⚠️  Price impact test failed:", priceError.message);
    }
    
    console.log("\n🎉 Trading tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Trading test failed:", error.message);
    console.error("Full error:", error);
  }
}

if (require.main === module) {
  testTradingComplete().catch(console.error);
}
