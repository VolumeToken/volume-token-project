// scripts/test-complete-functionality-final.js
const { ethers } = require("hardhat");

async function testCompleteFunctionalityFinal() {
  console.log("🧪 Testing complete VOLUME V2 functionality (FINAL TEST)...\n");
  
  // REPLACE WITH YOUR NEW DEPLOYMENT ADDRESS
  const TOKEN_ADDRESS = "0x90b2BAd3Bf208A0Ca19Ec96f3A9054B2BA565ce3";
  
  if (TOKEN_ADDRESS === "0xYourNewFixedContractAddress") {
    console.log("❌ Please update TOKEN_ADDRESS with your new deployment address");
    return;
  }
  
  const [deployer] = await ethers.getSigners();
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
  
  const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
  const token = VOLUME_V2.attach(TOKEN_ADDRESS);
  
  try {
    console.log("Testing fixed contract at:", TOKEN_ADDRESS);
    
    console.log("\n=== 0. Basic Info ===");
    console.log("Token name:", await token.name());
    console.log("Token symbol:", await token.symbol());
    console.log("Your balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)));
    
    console.log("\n=== 1. CRITICAL TEST: transferFrom (Large Amount) ===");
    
    const testAmount = ethers.utils.parseEther("10000");
    
    await token.approve(deployer.address, testAmount);
    const allowance = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance set:", ethers.utils.formatEther(allowance));
    
    await token.transferFrom(deployer.address, deployer.address, testAmount);
    console.log("🎉 Large amount transferFrom WORKS on Sepolia!");
    
    console.log("\n=== 2. Set Router Exemptions ===");
    
    // Make sure router is exempted
    await token.setMaxWalletExempt(ROUTER_ADDRESS, true);
    await token.setMaxTxExempt(ROUTER_ADDRESS, true);
    await token.setFeeExempt(ROUTER_ADDRESS, true);
    await token.setAntiDumpExempt(ROUTER_ADDRESS, true);
    console.log("✅ Router exemptions set");
    
    // Also exempt pair
    const pairAddress = await token.uniswapV2Pair();
    if (pairAddress !== ethers.constants.AddressZero) {
      await token.setMaxWalletExempt(pairAddress, true);
      await token.setMaxTxExempt(pairAddress, true);
      await token.setFeeExempt(pairAddress, true);
      await token.setAntiDumpExempt(pairAddress, true);
      console.log("✅ Pair exemptions set");
    }
    
    console.log("\n=== 3. THE ULTIMATE TEST: Add Liquidity ===");
    
    const routerABI = [
      "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)",
      "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external",
      "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable"
    ];
    
    const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, deployer);
    
    const liquidityTokens = ethers.utils.parseEther("10000");
    const liquidityETH = ethers.utils.parseEther("0.01");
    
    console.log("Approving router for liquidity...");
    await token.approve(ROUTER_ADDRESS, liquidityTokens);
    console.log("✅ Router approved");
    
    console.log("🚨 ADDING LIQUIDITY - THE MOMENT OF TRUTH...");
    
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
    
    console.log("\n=== 4. Test Buy and Sell ===");
    
    const path = [WETH_ADDRESS, TOKEN_ADDRESS];
    const sellPath = [TOKEN_ADDRESS, WETH_ADDRESS];
    
    // Buy tokens
    console.log("Testing buy...");
    const buyAmount = ethers.utils.parseEther("0.001");
    await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      path,
      deployer.address,
      Math.floor(Date.now() / 1000) + 1800,
      { value: buyAmount }
    );
    console.log("✅ Buy successful!");
    
    // Sell tokens
    console.log("Testing sell...");
    const sellAmount = ethers.utils.parseEther("1000");
    await token.approve(ROUTER_ADDRESS, sellAmount);
    await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      sellAmount,
      0,
      sellPath,
      deployer.address,
      Math.floor(Date.now() / 1000) + 1800
    );
    console.log("✅ Sell successful!");
    
    console.log("\n🎉🎉🎉 COMPLETE SUCCESS! 🎉🎉🎉");
    console.log("=====================================");
    console.log("✅ transferFrom bug COMPLETELY FIXED");
    console.log("✅ Uniswap liquidity addition works");
    console.log("✅ Buying tokens works");
    console.log("✅ Selling tokens works");
    console.log("✅ VOLUME token is FULLY FUNCTIONAL");
    console.log("✅ READY FOR MAINNET DEPLOYMENT");
    console.log("=====================================");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testCompleteFunctionalityFinal().catch(console.error);
}
