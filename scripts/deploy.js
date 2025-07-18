// scripts/deploy.js - UPDATED
const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying VOLUME ecosystem...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  try {
    // 1. Deploy TimelockController
    console.log("\n=== 1. Deploying TimelockController ===");
    const TimelockController = await ethers.getContractFactory("@openzeppelin/contracts/governance/TimelockController.sol:TimelockController");
    const timelock = await TimelockController.deploy(
      86400, // 1 day delay for testing (use longer for mainnet)
      [deployer.address],
      [deployer.address],
      ethers.constants.AddressZero
    );
    await timelock.deployed();
    console.log("✅ TimelockController:", timelock.address);

    // 2. Deploy VOLUME token
    console.log("\n=== 2. Deploying VOLUME Token ===");
    const VOLUME = await ethers.getContractFactory("VOLUME");
    const token = await VOLUME.deploy(
      deployer.address, // marketing (update for mainnet)
      deployer.address, // retailer (update for mainnet)
      ethers.constants.AddressZero, // router (update for Uniswap)
      timelock.address
    );
    await token.deployed();
    console.log("✅ VOLUME Token:", token.address);

    // 3. Deploy TeamVesting
    console.log("\n=== 3. Deploying TeamVesting ===");
    const TeamVesting = await ethers.getContractFactory("TeamVesting");
    const totalSupply = await token.totalSupply();
    const teamTokens = totalSupply.mul(5).div(100); // 5%
    const startTime = Math.floor(Date.now() / 1000) + (30 * 24 * 3600); // 30 days cliff
    
    const vesting = await TeamVesting.deploy(
      token.address,
      deployer.address,
      teamTokens,
      startTime
    );
    await vesting.deployed();
    console.log("✅ TeamVesting:", vesting.address);

    // 4. Set exemptions BEFORE transferring
    console.log("\n=== 4. Setting Up Token Distribution ===");
    await token.setMaxWalletExempt(vesting.address, true);
    await token.setMaxTxExempt(vesting.address, true);
    console.log("✅ Vesting contract exemptions set");

    // 5. Transfer team tokens
    await token.transfer(vesting.address, teamTokens);
    console.log("✅ Team tokens transferred to vesting");

    // 6. Transfer ownership to timelock
    console.log("\n=== 5. Transferring Ownership ===");
    await token.transferOwnership(timelock.address);
    console.log("✅ Ownership transferred to timelock");

    // 7. Final verification
    console.log("\n=== 6. Final Verification ===");
    console.log("Token Name:", await token.name());
    console.log("Token Symbol:", await token.symbol());
    console.log("Total Supply:", ethers.utils.formatEther(await token.totalSupply()));
    console.log("Owner:", await token.owner());
    console.log("Deployer Balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)));
    console.log("Vesting Balance:", ethers.utils.formatEther(await token.balanceOf(vesting.address)));

    // Save deployment info
    const deploymentInfo = {
      network: hre.network.name,
      timestamp: new Date().toISOString(),
      contracts: {
        VOLUME: token.address,
        TimelockController: timelock.address,
        TeamVesting: vesting.address,
      },
      configuration: {
        teamTokensAmount: ethers.utils.formatEther(teamTokens),
        vestingStartTime: new Date(startTime * 1000).toISOString(),
        timelockDelay: "86400 seconds (1 day)",
      }
    };

    console.log("\n🎉 Deployment completed successfully!");
    console.log("\n📋 Deployment Summary:");
    console.log(JSON.stringify(deploymentInfo, null, 2));

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
