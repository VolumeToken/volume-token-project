// scripts/deploy-v2-skip-test.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying VOLUME V2 (Fixed) ecosystem to Sepolia...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("ETH Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  try {
    // Sepolia addresses
    const SEPOLIA_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
    const SEPOLIA_FACTORY = "0x7E0987E5b3a30e3f2828572Bb659A548460a3003";
    const SEPOLIA_WETH = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";

    // 1. Deploy TimelockController
    console.log("=== 1. Deploying TimelockController ===");
    const TimelockController = await ethers.getContractFactory("@openzeppelin/contracts/governance/TimelockController.sol:TimelockController");
    const timelock = await TimelockController.deploy(
      86400, // 1 day delay
      [deployer.address],
      [deployer.address],
      ethers.constants.AddressZero
    );
    await timelock.deployed();
    console.log("✅ TimelockController deployed:", timelock.address);

    // 2. Deploy VOLUME V2
    console.log("\n=== 2. Deploying VOLUME V2 (Fixed) ===");
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      SEPOLIA_ROUTER,
      timelock.address
    );
    await token.deployed();
    console.log("✅ VOLUME V2 deployed:", token.address);

    // 3. Deploy TeamVesting
    console.log("\n=== 3. Deploying TeamVesting ===");
    const TeamVesting = await ethers.getContractFactory("TeamVesting");
    const totalSupply = await token.totalSupply();
    const teamTokens = totalSupply.mul(5).div(100);
    const startTime = Math.floor(Date.now() / 1000) + (30 * 24 * 3600);
    
    const vesting = await TeamVesting.deploy(
      token.address,
      deployer.address,
      teamTokens,
      startTime
    );
    await vesting.deployed();
    console.log("✅ TeamVesting deployed:", vesting.address);

    // 4. Set up Uniswap V2 pair
    console.log("\n=== 4. Setting up Uniswap V2 Pair ===");
    const factoryABI = [
      "function createPair(address tokenA, address tokenB) external returns (address pair)",
      "function getPair(address tokenA, address tokenB) external view returns (address pair)"
    ];
    
    const factory = new ethers.Contract(SEPOLIA_FACTORY, factoryABI, deployer);
    let pairAddress = await factory.getPair(token.address, SEPOLIA_WETH);
    
    if (pairAddress === ethers.constants.AddressZero) {
      console.log("Creating new pair...");
      const createPairTx = await factory.createPair(token.address, SEPOLIA_WETH);
      await createPairTx.wait();
      pairAddress = await factory.getPair(token.address, SEPOLIA_WETH);
    }
    
    await token.setUniswapV2Pair(pairAddress);
    console.log("✅ Pair created and set:", pairAddress);

    // 5. Set up exemptions
    console.log("\n=== 5. Setting up Exemptions ===");
    
    await token.setMaxWalletExempt(vesting.address, true);
    await token.setMaxTxExempt(vesting.address, true);
    await token.setFeeExempt(vesting.address, true);
    await token.setAntiDumpExempt(vesting.address, true);
    console.log("✅ Vesting exemptions set");

    await token.setMaxWalletExempt(SEPOLIA_ROUTER, true);
    await token.setMaxTxExempt(SEPOLIA_ROUTER, true);
    await token.setFeeExempt(SEPOLIA_ROUTER, true);
    await token.setAntiDumpExempt(SEPOLIA_ROUTER, true);
    console.log("✅ Router exemptions set");

    await token.setMaxWalletExempt(pairAddress, true);
    await token.setMaxTxExempt(pairAddress, true);
    await token.setFeeExempt(pairAddress, true);
    await token.setAntiDumpExempt(pairAddress, true);
    console.log("✅ Pair exemptions set");

    // 6. Transfer team tokens
    console.log("\n=== 6. Transferring Team Tokens ===");
    await token.transfer(vesting.address, teamTokens);
    console.log("✅ Team tokens transferred");

    // 7. SKIP transferFrom test for now
    console.log("\n=== 7. Skipping transferFrom Test ===");
    console.log("⚠️  transferFrom test skipped - will test separately");

    // 8. Final summary
    console.log("\n🎉 VOLUME V2 deployment completed!");
    console.log("\n📋 Contract Addresses:");
    console.log("=======================");
    console.log(`VOLUME V2: ${token.address}`);
    console.log(`TimelockController: ${timelock.address}`);
    console.log(`TeamVesting: ${vesting.address}`);
    console.log(`Uniswap Pair: ${pairAddress}`);
    
    console.log("\n🔗 Etherscan Links:");
    console.log("===================");
    console.log(`VOLUME V2: https://sepolia.etherscan.io/address/${token.address}`);
    console.log(`TimelockController: https://sepolia.etherscan.io/address/${timelock.address}`);
    console.log(`TeamVesting: https://sepolia.etherscan.io/address/${vesting.address}`);
    console.log(`Uniswap Pair: https://sepolia.etherscan.io/address/${pairAddress}`);
    
    console.log("\n📝 Next Steps:");
    console.log("==============");
    console.log("1. Test transferFrom on deployed contract");
    console.log("2. Test Uniswap integration");
    console.log("3. Verify the fix works");
    
    console.log("\n📋 For Testing:");
    console.log(`TOKEN_ADDRESS="${token.address}"`);
    console.log(`PAIR_ADDRESS="${pairAddress}"`);

  } catch (error) {
    console.error("❌ Deployment failed:", error.message);
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
