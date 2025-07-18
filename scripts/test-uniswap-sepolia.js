// scripts/test-uniswap-sepolia.js
const { ethers } = require("hardhat");

async function testUniswapSepolia() {
  console.log("🦄 Testing Uniswap V2 integration on Sepolia...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("ETH Balance:", ethers.utils.formatEther(await deployer.getBalance()));
  
  // Your deployed contracts
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  
  // Sepolia Uniswap V2 addresses
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  const FACTORY_ADDRESS = "0x7E0987E5b3a30e3f2828572Bb659A548460a3003";
  const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
  
  try {
    const VOLUME = await ethers.getContractFactory("VOLUME");
    const token = VOLUME.attach(TOKEN_ADDRESS);
    
    console.log("=== 1. Token Info ===");
    console.log("Name:", await token.name());
    console.log("Symbol:", await token.symbol());
    console.log("Balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)));
    
    console.log("\n=== 2. Connect to Uniswap V2 ===");
    const routerABI = [
      "function factory() external pure returns (address)",
      "function WETH() external pure returns (address)",
      "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)"
    ];
    
    const factoryABI = [
      "function getPair(address tokenA, address tokenB) external view returns (address pair)",
      "function createPair(address tokenA, address tokenB) external returns (address pair)"
    ];
    
    const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, deployer);
    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, deployer);
    
    console.log("Router Factory:", await router.factory());
    console.log("WETH:", await router.WETH());
    
    console.log("\n=== 3. Check/Create Trading Pair ===");
    let pairAddress = await factory.getPair(TOKEN_ADDRESS, WETH_ADDRESS);
    
    if (pairAddress === ethers.constants.AddressZero) {
      console.log("Creating new trading pair...");
      const createTx = await factory.createPair(TOKEN_ADDRESS, WETH_ADDRESS);
      await createTx.wait();
      pairAddress = await factory.getPair(TOKEN_ADDRESS, WETH_ADDRESS);
      console.log("✅ Trading pair created:", pairAddress);
    } else {
      console.log("✅ Trading pair exists:", pairAddress);
    }
    
    console.log("\n=== 4. Add Liquidity ===");
    const liquidityTokens = ethers.utils.parseEther("10000"); // 10K tokens
    const liquidityETH = ethers.utils.parseEther("0.01"); // 0.01 ETH
    
    // Approve router
    console.log("Approving router to spend tokens...");
    await token.approve(ROUTER_ADDRESS, liquidityTokens);
    console.log("✅ Router approved");
    
    // Add liquidity
    console.log("Adding liquidity...");
    const deadline = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
    
    const addLiquidityTx = await router.addLiquidityETH(
      TOKEN_ADDRESS,
      liquidityTokens,
      liquidityTokens.mul(95).div(100), // 5% slippage
      liquidityETH.mul(95).div(100),
      deployer.address,
      deadline,
      { value: liquidityETH }
    );
    
    await addLiquidityTx.wait();
    console.log("✅ Liquidity added successfully!");
    console.log("Transaction:", addLiquidityTx.hash);
    
    console.log("\n🎉 Uniswap V2 integration successful!");
    console.log("🔗 Trading pair:", pairAddress);
    console.log("🔗 View on Sepolia Etherscan:", `https://sepolia.etherscan.io/address/${pairAddress}`);
    
  } catch (error) {
    console.error("❌ Uniswap test failed:", error.message);
  }
}

if (require.main === module) {
  testUniswapSepolia().catch(console.error);
}
