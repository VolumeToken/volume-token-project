// scripts/debug-pair-creation-failure.js
const { ethers } = require("hardhat");

async function debugPairCreationFailure() {
  console.log("🔍 Debugging pair creation failure...\n");
  
  try {
    const TOKEN_ADDRESS = "0x5D3a740cb69Df9e36389C9DD2e2015F8408A3f52";
    const WETH_ADDRESS = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";
    const FACTORY_ADDRESS = "0x7E0987E5b3a30e3f2828572Bb659A548460a3003";
    
    const factoryABI = [
      "function getPair(address tokenA, address tokenB) external view returns (address pair)",
      "function allPairsLength() external view returns (uint256)",
      "function createPair(address tokenA, address tokenB) external returns (address pair)"
    ];
    
    const factory = new ethers.Contract(FACTORY_ADDRESS, factoryABI, ethers.provider);
    
    console.log("=== Check Current State ===");
    
    // Check if pair already exists
    const existingPair = await factory.getPair(TOKEN_ADDRESS, WETH_ADDRESS);
    console.log("Existing pair address:", existingPair);
    
    if (existingPair !== ethers.constants.AddressZero) {
      console.log("🎯 FOUND THE ISSUE: Pair already exists!");
      console.log("Pair address:", existingPair);
      console.log("We can skip creation and use this pair");
      return existingPair;
    }
    
    // Check factory is working
    const totalPairs = await factory.allPairsLength();
    console.log("Total pairs in factory:", totalPairs.toString());
    
    console.log("\n=== Check Token Validity ===");
    
    // Check if our token is valid
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    const token = VOLUME_V2.attach(TOKEN_ADDRESS);
    
    const tokenName = await token.name();
    const tokenSymbol = await token.symbol();
    const tokenSupply = await token.totalSupply();
    
    console.log("Token name:", tokenName);
    console.log("Token symbol:", tokenSymbol);
    console.log("Token supply:", ethers.utils.formatEther(tokenSupply));
    
    // Check WETH
    const wethABI = ["function symbol() external view returns (string)"];
    const weth = new ethers.Contract(WETH_ADDRESS, wethABI, ethers.provider);
    const wethSymbol = await weth.symbol();
    console.log("WETH symbol:", wethSymbol);
    
    console.log("\n=== The Issue ===");
    console.log("Factory reverted the createPair call");
    console.log("Most common reasons:");
    console.log("1. Pair already exists (checked above)");
    console.log("2. Gas limit too low");
    console.log("3. Token contracts have issues");
    console.log("4. Factory contract restrictions");
    
    return null;
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
    return null;
  }
}

if (require.main === module) {
  debugPairCreationFailure().catch(console.error);
}
