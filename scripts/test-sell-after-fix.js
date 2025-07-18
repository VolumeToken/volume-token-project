// scripts/test-sell-after-fix.js
const { ethers } = require("hardhat");

async function testSellAfterFix() {
  console.log("💰 Testing sell after fixes...\n");
  
  const [deployer] = await ethers.getSigners();
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  const routerABI = [
    "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external"
  ];
  const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, deployer);
  
  try {
    console.log("=== Pre-sell Checks ===");
    
    const balance = await token.balanceOf(deployer.address);
    const pairAddress = await token.uniswapV2Pair();
    const allowance = await token.allowance(deployer.address, ROUTER_ADDRESS);
    
    console.log("Deployer balance:", ethers.utils.formatEther(balance));
    console.log("Pair address:", pairAddress);
    console.log("Router allowance:", ethers.utils.formatEther(allowance));
    
    if (pairAddress === ethers.constants.AddressZero) {
      console.log("❌ Pair address still zero - run fix-pair-address.js first");
      return;
    }
    
    console.log("\n=== Attempting Sell ===");
    
    const sellAmount = ethers.utils.parseEther("100"); // 100 VOLUME
    const path = [TOKEN_ADDRESS, WETH_ADDRESS];
    const deadline = Math.floor(Date.now() / 1000) + 1800;
    
    console.log("Selling:", ethers.utils.formatEther(sellAmount), "VOLUME");
    
    // Fresh approval
    await token.approve(ROUTER_ADDRESS, sellAmount.mul(2));
    console.log("✅ Fresh approval done");
    
    // Get ETH balance before
    const ethBefore = await deployer.getBalance();
    console.log("ETH before:", ethers.utils.formatEther(ethBefore));
    
    // Attempt sell with conservative gas limit
    const sellTx = await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      sellAmount,
      0, // Accept any amount of ETH
      path,
      deployer.address,
      deadline,
      { gasLimit: 400000 }
    );
    
    console.log("Sell transaction sent:", sellTx.hash);
    await sellTx.wait();
    
    console.log("✅ Sell successful!");
    
    // Check results
    const ethAfter = await deployer.getBalance();
    const balanceAfter = await token.balanceOf(deployer.address);
    
    console.log("ETH after:", ethers.utils.formatEther(ethAfter));
    console.log("ETH gained:", ethers.utils.formatEther(ethAfter.sub(ethBefore)));
    console.log("VOLUME balance after:", ethers.utils.formatEther(balanceAfter));
    
    console.log("\n🎉 Sell test successful!");
    
  } catch (error) {
    console.error("❌ Sell test failed:", error.message);
  }
}

if (require.main === module) {
  testSellAfterFix().catch(console.error);
}
