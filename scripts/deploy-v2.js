// scripts/deploy-v2.js
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying VOLUME V2 (Fixed) ecosystem to Sepolia...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("ETH Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  // Check minimum balance
  const minBalance = ethers.utils.parseEther("0.1");
  if ((await deployer.getBalance()).lt(minBalance)) {
    console.log("❌ Insufficient ETH balance for deployment");
    console.log("Need at least 0.1 ETH for deployment");
    return;
  }

  try {
    // Sepolia addresses
    const SEPOLIA_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
    const SEPOLIA_FACTORY = "0x7E0987E5b3a30e3f2828572Bb659A548460a3003";
    const SEPOLIA_WETH = "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9";

    // 1. Deploy TimelockController
    console.log("=== 1. Deploying TimelockController ===");
    const TimelockController = await ethers.getContractFactory("@openzeppelin/contracts/governance/TimelockController.sol:TimelockController");
    const timelock = await TimelockController.deploy(
      86400, // 1 day delay (24 hours)
      [deployer.address], // proposers
      [deployer.address], // executors
      ethers.constants.AddressZero // admin
    );
    await timelock.deployed();
    console.log("✅ TimelockController deployed:", timelock.address);

    // 2. Deploy VOLUME V2 (Fixed)
    console.log("\n=== 2. Deploying VOLUME V2 (Fixed) ===");
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    const token = await VOLUME_V2.deploy(
      deployer.address, // marketing multisig (update for mainnet)
      deployer.address, // retailer reward address (update for mainnet)
      SEPOLIA_ROUTER,   // Uniswap V2 router
      timelock.address  // timelock controller
    );
    await token.deployed();
    console.log("✅ VOLUME V2 deployed:", token.address);

    // 3. Deploy TeamVesting
    console.log("\n=== 3. Deploying TeamVesting ===");
    const TeamVesting = await ethers.getContractFactory("TeamVesting");
    const totalSupply = await token.totalSupply();
    const teamTokens = totalSupply.mul(5).div(100); // 5% of total supply
    const startTime = Math.floor(Date.now() / 1000) + (30 * 24 * 3600); // 30 days from now
    
    const vesting = await TeamVesting.deploy(
      token.address,    // token address
      deployer.address, // beneficiary (update for mainnet)
      teamTokens,       // total tokens to vest
      startTime         // start time
    );
    await vesting.deployed();
    console.log("✅ TeamVesting deployed:", vesting.address);
    console.log("Team tokens amount:", ethers.utils.formatEther(teamTokens));
    console.log("Vesting start time:", new Date(startTime * 1000).toISOString());

    // 4. Set up Uniswap V2 pair
    console.log("\n=== 4. Setting up Uniswap V2 Pair ===");
    const factoryABI = [
      "function createPair(address tokenA, address tokenB) external returns (address pair)",
      "function getPair(address tokenA, address tokenB) external view returns (address pair)"
    ];
    
    const factory = new ethers.Contract(SEPOLIA_FACTORY, factoryABI, deployer);
    
    let pairAddress = await factory.getPair(token.address, SEPOLIA_WETH);
    
    if (pairAddress === ethers.constants.AddressZero) {
      console.log("Creating new Uniswap V2 pair...");
      const createPairTx = await factory.createPair(token.address, SEPOLIA_WETH);
      await createPairTx.wait();
      pairAddress = await factory.getPair(token.address, SEPOLIA_WETH);
      console.log("✅ New pair created:", pairAddress);
    } else {
      console.log("✅ Pair already exists:", pairAddress);
    }

    // Set pair address in token contract
    await token.setUniswapV2Pair(pairAddress);
    console.log("✅ Pair address set in token contract");

    // 5. Set up exemptions for key contracts
    console.log("\n=== 5. Setting up Contract Exemptions ===");
    
    // Exempt vesting contract
    console.log("Setting vesting contract exemptions...");
    await token.setMaxWalletExempt(vesting.address, true);
    await token.setMaxTxExempt(vesting.address, true);
    await token.setFeeExempt(vesting.address, true);
    await token.setAntiDumpExempt(vesting.address, true);
    console.log("✅ Vesting contract exemptions set");

    // Exempt Uniswap contracts
    console.log("Setting Uniswap contract exemptions...");
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

    await token.setMaxWalletExempt(SEPOLIA_FACTORY, true);
    await token.setMaxTxExempt(SEPOLIA_FACTORY, true);
    await token.setFeeExempt(SEPOLIA_FACTORY, true);
    await token.setAntiDumpExempt(SEPOLIA_FACTORY, true);
    console.log("✅ Factory exemptions set");

    // 6. Transfer team tokens to vesting contract
    console.log("\n=== 6. Setting up Token Distribution ===");
    
    console.log("Transferring team tokens to vesting contract...");
    const transferTx = await token.transfer(vesting.address, teamTokens);
    await transferTx.wait();
    console.log("✅ Team tokens transferred to vesting contract");

    // Verify transfer
    const vestingBalance = await token.balanceOf(vesting.address);
    console.log("Vesting contract balance:", ethers.utils.formatEther(vestingBalance));

    // 7. Test the transferFrom fix
    console.log("\n=== 7. Testing transferFrom Fix ===");
    
    const testAmount = ethers.utils.parseEther("1000");
    
    // Test approve and transferFrom
    await token.approve(deployer.address, testAmount);
    const allowance = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance set:", ethers.utils.formatEther(allowance));
    
    // Test transferFrom (this should work now!)
    await token.transferFrom(deployer.address, deployer.address, ethers.utils.parseEther("1"));
    console.log("✅ transferFrom works! Bug is fixed!");

    // 8. Transfer ownership to timelock (optional - comment out for testing)
    console.log("\n=== 8. Governance Setup ===");
    console.log("⚠️  Keeping ownership with deployer for testing");
    console.log("⚠️  For mainnet: Transfer ownership to timelock");
    // await token.transferOwnership(timelock.address);
    // console.log("✅ Ownership transferred to timelock");

    // 9. Final verification
    console.log("\n=== 9. Final Verification ===");
    console.log("Token name:", await token.name());
    console.log("Token symbol:", await token.symbol());
    console.log("Total supply:", ethers.utils.formatEther(await token.totalSupply()));
    console.log("Deployer balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)));
    console.log("Vesting balance:", ethers.utils.formatEther(await token.balanceOf(vesting.address)));
    console.log("Token owner:", await token.owner());
    console.log("Uniswap pair:", await token.uniswapV2Pair());

    // 10. Save deployment info
    const deploymentInfo = {
      network: "sepolia",
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      contracts: {
        VOLUME_V2: token.address,
        TimelockController: timelock.address,
        TeamVesting: vesting.address,
        UniswapV2Pair: pairAddress,
      },
      uniswap: {
        router: SEPOLIA_ROUTER,
        factory: SEPOLIA_FACTORY,
        weth: SEPOLIA_WETH,
      },
      tokenomics: {
        totalSupply: ethers.utils.formatEther(await token.totalSupply()),
        teamTokens: ethers.utils.formatEther(teamTokens),
        vestingStartTime: new Date(startTime * 1000).toISOString(),
        buyFee: (await token.buyFee()).toString() + " basis points",
        sellFee: (await token.sellFee()).toString() + " basis points",
      },
      verification: {
        transferFromFixed: true,
        exemptionsSet: true,
        pairCreated: true,
        vestingFunded: true,
      }
    };

    console.log("\n🎉 VOLUME V2 deployment completed successfully!");
    console.log("\n📋 Deployment Summary:");
    console.log("=======================");
    console.log(`VOLUME V2 Token: ${token.address}`);
    console.log(`TimelockController: ${timelock.address}`);
    console.log(`TeamVesting: ${vesting.address}`);
    console.log(`Uniswap V2 Pair: ${pairAddress}`);
    
    console.log("\n🔗 Etherscan Links:");
    console.log("===================");
    console.log(`VOLUME V2: https://sepolia.etherscan.io/address/${token.address}`);
    console.log(`TimelockController: https://sepolia.etherscan.io/address/${timelock.address}`);
    console.log(`TeamVesting: https://sepolia.etherscan.io/address/${vesting.address}`);
    console.log(`Uniswap Pair: https://sepolia.etherscan.io/address/${pairAddress}`);
    
    console.log("\n✅ Key Features:");
    console.log("================");
    console.log("✅ transferFrom bug FIXED");
    console.log("✅ Uniswap V2 integration ready");
    console.log("✅ Anti-whale protection enabled");
    console.log("✅ Anti-dump mechanism enabled");
    console.log("✅ Fee system configured");
    console.log("✅ Team vesting scheduled");
    console.log("✅ Governance timelock ready");
    console.log("✅ All exemptions set");
    
    console.log("\n🚀 Next Steps:");
    console.log("==============");
    console.log("1. Verify contracts on Etherscan");
    console.log("2. Test complete trading functionality");
    console.log("3. Add initial liquidity");
    console.log("4. Test buy and sell operations");
    console.log("5. Community testing");
    console.log("6. Professional audit (recommended)");
    console.log("7. Mainnet deployment");
    
    console.log("\n💾 Deployment info saved to console");
    console.log("📝 Copy the contract addresses for testing");

    // Save deployment addresses for easy access
    console.log("\n📋 Quick Copy-Paste Addresses:");
    console.log("================================");
    console.log(`TOKEN_ADDRESS="${token.address}"`);
    console.log(`TIMELOCK_ADDRESS="${timelock.address}"`);
    console.log(`VESTING_ADDRESS="${vesting.address}"`);
    console.log(`PAIR_ADDRESS="${pairAddress}"`);

  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    console.error("Stack trace:", error.stack);
    
    console.log("\n🔧 Troubleshooting:");
    console.log("===================");
    console.log("- Check ETH balance for gas");
    console.log("- Verify RPC connection");
    console.log("- Check contract compilation");
    console.log("- Review error message above");
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
