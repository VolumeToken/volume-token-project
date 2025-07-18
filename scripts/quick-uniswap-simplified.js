// scripts/quick-uniswap-simplified.js
const { ethers } = require("hardhat");

async function quickUniswapSimplified() {
  console.log("🚀 Quick Uniswap test (simplified)...\n");
  
  try {
    const [deployer] = await ethers.getSigners();
    const TOKEN_ADDRESS = "0x5D3a740cb69Df9e36389C9DD2e2015F8408A3f52";
    const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
    const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
    
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    const token = VOLUME_V2.attach(TOKEN_ADDRESS);
    
    console.log("=== 1. Create/Get Pair ===");
    
    const factoryABI = [
      "function createPair(address tokenA, address tokenB) external returns (address pair)",
      "function getPair(address tokenA, address tokenB) external view returns (address pair)"
    ];
    
    const factory = new ethers.Contract("0x7E0987E5b3a30e3f2828572Bb659A548460a3003", factoryABI, deployer);
    
    let pairAddress = await factory.getPair(TOKEN_ADDRESS, WETH_ADDRESS);
    
    if (pairAddress === ethers.constants.AddressZero) {
      console.log("Creating pair...");
      const createTx = await factory.createPair(TOKEN_ADDRESS, WETH_ADDRESS);
      await createTx.wait();
      pairAddress = await factory.getPair(TOKEN_ADDRESS, WETH_ADDRESS);
    }
    
    console.log("✅ Pair address:", pairAddress);
    
    console.log("\n=== 2. Set Up Contract ===");
    
    // Set pair in contract
    await token.setUniswapV2Pair(pairAddress);
    console.log("✅ Pair set in contract");
    
    // Exempt all addresses
    const addressesToExempt = [pairAddress, ROUTER_ADDRESS, WETH_ADDRESS];
    
    for (const addr of addressesToExempt) {
      await token.setMaxWalletExempt(addr, true);
      await token.setMaxTxExempt(addr, true);
      await token.setFeeExempt(addr, true);
      await token.setAntiDumpExempt(addr, true);
      console.log(`✅ ${addr} exempted`);
    }
    
    console.log("\n=== 3. Manual Liquidity Addition ===");
    
    const liquidityTokens = ethers.utils.parseEther("10000");
    const liquidityETH = ethers.utils.parseEther("0.01");
    
    console.log("Your token balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)));
    console.log("Your ETH balance:", ethers.utils.formatEther(await deployer.getBalance()));
    
    // Transfer tokens directly to pair
    console.log("Transferring tokens to pair...");
    await token.transfer(pairAddress, liquidityTokens);
    
    // Send ETH to WETH and then to pair
    const wethABI = [
      "function deposit() external payable",
      "function transfer(address to, uint256 amount) external returns (bool)"
    ];
    
    const weth = new ethers.Contract(WETH_ADDRESS, wethABI, deployer);
    
    console.log("Converting ETH to WETH...");
    await weth.deposit({ value: liquidityETH });
    
    console.log("Transferring WETH to pair...");
    await weth.transfer(pairAddress, liquidityETH);
    
    // Mint liquidity
    const pairABI = [
      "function mint(address to) external returns (uint liquidity)",
      "function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)"
    ];
    
    const pair = new ethers.Contract(pairAddress, pairABI, deployer);
    
    console.log("Minting liquidity...");
    const mintTx = await pair.mint(deployer.address);
    await mintTx.wait();
    
    console.log("🎉 LIQUIDITY ADDED!");
    
    // Check reserves
    const [reserve0, reserve1] = await pair.getReserves();
    console.log("Reserve 0:", ethers.utils.formatEther(reserve0));
    console.log("Reserve 1:", ethers.utils.formatEther(reserve1));
    
    console.log("\n=== 4. Test Buy ===");
    
    const routerABI = [
      "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable"
    ];
    
    const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, deployer);
    
    const buyAmount = ethers.utils.parseEther("0.001");
    const path = [WETH_ADDRESS, TOKEN_ADDRESS];
    
    console.log("Testing buy...");
    const buyTx = await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      0,
      path,
      deployer.address,
      Math.floor(Date.now() / 1000) + 1800,
      { value: buyAmount }
    );
    await buyTx.wait();
    
    console.log("🎉🎉🎉 BUY SUCCESSFUL! YOUR TOKEN IS TRADING! 🎉🎉🎉");
    
    console.log("\n📋 TRADING TOKEN INFO:");
    console.log("Token Address:", TOKEN_ADDRESS);
    console.log("Pair Address:", pairAddress);
    console.log("Etherscan Token:", `https://sepolia.etherscan.io/address/${TOKEN_ADDRESS}`);
    console.log("Etherscan Pair:", `https://sepolia.etherscan.io/address/${pairAddress}`);
    
    console.log("\n🏆 MISSION ACCOMPLISHED!");
    console.log("✅ Your VOLUME token is live and trading on Uniswap!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  quickUniswapSimplified().catch(console.error);
}
