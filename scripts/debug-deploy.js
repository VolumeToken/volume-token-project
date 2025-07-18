// scripts/debug-deploy.js - FINAL FIX
const { ethers } = require("hardhat");

async function debugDeploy() {
  console.log("🔍 Debugging deployment step by step...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.utils.formatEther(await deployer.getBalance()), "ETH");

  let timelock;

  try {
    // Test 1: Deploy TimelockController
    console.log("\n=== 1. Testing TimelockController ===");
    const TimelockController = await ethers.getContractFactory("@openzeppelin/contracts/governance/TimelockController.sol:TimelockController");
    console.log("✅ TimelockController factory created");
    
    timelock = await TimelockController.deploy(
      86400, // 1 day delay
      [deployer.address],
      [deployer.address],
      ethers.constants.AddressZero
    );
    await timelock.deployed();
    console.log("✅ TimelockController deployed:", timelock.address);

    // Test 2: Deploy VOLUME token
    console.log("\n=== 2. Testing VOLUME Token ===");
    const VOLUME = await ethers.getContractFactory("VOLUME");
    console.log("✅ VOLUME factory created");
    
    const token = await VOLUME.deploy(
      deployer.address, // marketing
      deployer.address, // retailer
      ethers.constants.AddressZero, // router (zero for local testing)
      timelock.address
    );
    await token.deployed();
    console.log("✅ VOLUME Token deployed:", token.address);

    // Test 3: Deploy TeamVesting
    console.log("\n=== 3. Testing TeamVesting ===");
    const TeamVesting = await ethers.getContractFactory("TeamVesting");
    console.log("✅ TeamVesting factory created");
    
    const totalSupply = await token.totalSupply();
    const teamTokens = totalSupply.mul(5).div(100); // 5%
    const startTime = Math.floor(Date.now() / 1000) + 86400; // 1 day from now
    
    const vesting = await TeamVesting.deploy(
      token.address,
      deployer.address,
      teamTokens,
      startTime
    );
    await vesting.deployed();
    console.log("✅ TeamVesting deployed:", vesting.address);

    // Test 4: Set exemptions BEFORE transferring
    console.log("\n=== 4. Setting Up Exemptions ===");
    
    // Exempt vesting contract from max wallet limits
    await token.setMaxWalletExempt(vesting.address, true);
    console.log("✅ Vesting contract exempt from max wallet limits");
    
    // Also exempt from max transaction limits (just in case)
    await token.setMaxTxExempt(vesting.address, true);
    console.log("✅ Vesting contract exempt from max transaction limits");

    // Test 5: Transfer team tokens
    console.log("\n=== 5. Testing Token Transfer ===");
    await token.transfer(vesting.address, teamTokens);
    console.log("✅ Team tokens transferred to vesting");

    // Test 6: Final verification
    console.log("\n=== 6. Final Verification ===");
    console.log("Token Name:", await token.name());
    console.log("Token Symbol:", await token.symbol());
    console.log("Total Supply:", ethers.utils.formatEther(await token.totalSupply()));
    console.log("Deployer Balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)));
    console.log("Vesting Balance:", ethers.utils.formatEther(await token.balanceOf(vesting.address)));

    // Test 7: Verify exemptions
    console.log("\n=== 7. Verifying Exemptions ===");
    console.log("Vesting max wallet exempt:", await token.maxWalletExempt(vesting.address));
    console.log("Vesting max tx exempt:", await token.maxTxExempt(vesting.address));

    console.log("\n🎉 All contracts deployed successfully!");

    console.log("\n📋 Contract Addresses:");
    console.log("TimelockController:", timelock.address);
    console.log("VOLUME Token:", token.address);
    console.log("TeamVesting:", vesting.address);

  } catch (error) {
    console.error("\n❌ Deployment failed at step:", error.message);
    console.error("Full error:", error);
  }
}

if (require.main === module) {
  debugDeploy().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
