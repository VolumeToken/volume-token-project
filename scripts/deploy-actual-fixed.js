// scripts/deploy-actual-fixed.js
const { ethers } = require("hardhat");

async function deployActualFixed() {
  console.log("🚀 Deploying ACTUAL FIXED VOLUME V2...\n");
  
  const [deployer] = await ethers.getSigners();
  
  try {
    console.log("=== 1. Verify Local Contract Bytecode ===");
    
    // Get the contract factory
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    const localBytecode = VOLUME_V2.bytecode;
    console.log("Local bytecode length:", localBytecode.length);
    
    // This should be the longer bytecode (22876)
    if (localBytecode.length < 22000) {
      console.log("❌ CRITICAL: Local bytecode is too short!");
      console.log("The fix wasn't compiled correctly");
      return;
    }
    
    console.log("✅ Local bytecode has expected length");
    
    console.log("\n=== 2. Test Local Contract Immediately ===");
    
    // Deploy and test locally first
    const testToken = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await testToken.deployed();
    console.log("✅ Local test deployment successful");
    
    // Test the transferFrom fix
    const testAmount = ethers.utils.parseEther("10000");
    
    await testToken.approve(deployer.address, testAmount);
    const allowance = await testToken.allowance(deployer.address, deployer.address);
    console.log("Local test allowance:", ethers.utils.formatEther(allowance));
    
    if (allowance.eq(0)) {
      console.log("❌ CRITICAL: Local contract still has broken approve!");
      return;
    }
    
    await testToken.transferFrom(deployer.address, deployer.address, testAmount);
    console.log("✅ Local transferFrom works perfectly");
    
    console.log("\n=== 3. Deploy to Sepolia with Verification ===");
    
    console.log("Deploying FIXED version to Sepolia...");
    
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008", // Sepolia router
      deployer.address
    );
    await token.deployed();
    
    console.log("✅ FIXED VERSION deployed to:", token.address);
    
    console.log("\n=== 4. Verify Deployed Contract Immediately ===");
    
    // Check deployed bytecode
    const deployedBytecode = await ethers.provider.getCode(token.address);
    console.log("Deployed bytecode length:", deployedBytecode.length);
    
    // Compare with local
    const bytecodesMatch = localBytecode.toLowerCase() === deployedBytecode.toLowerCase();
    console.log("Bytecodes match:", bytecodesMatch);
    
    if (!bytecodesMatch) {
      console.log("❌ CRITICAL: Deployed contract STILL doesn't match local!");
      console.log("There's a fundamental deployment issue");
      return;
    }
    
    console.log("✅ Deployed contract matches local - using fixed code");
    
    console.log("\n=== 5. Test Deployed Contract ===");
    
    // Test the deployed contract
    await token.approve(deployer.address, testAmount);
    const deployedAllowance = await token.allowance(deployer.address, deployer.address);
    console.log("Deployed allowance:", ethers.utils.formatEther(deployedAllowance));
    
    if (deployedAllowance.eq(0)) {
      console.log("❌ CRITICAL: Deployed contract still has broken approve!");
      return;
    }
    
    await token.transferFrom(deployer.address, deployer.address, testAmount);
    console.log("✅ Deployed transferFrom works!");
    
    console.log("\n🎉 SUCCESS! Fixed contract deployed and verified!");
    console.log("==============================================");
    console.log("New contract address:", token.address);
    console.log("Etherscan:", `https://sepolia.etherscan.io/address/${token.address}`);
    console.log("✅ This contract has the transferFrom fix");
    console.log("✅ Ready for full functionality testing");
    
  } catch (error) {
    console.error("❌ Deploy failed:", error.message);
  }
}

if (require.main === module) {
  deployActualFixed().catch(console.error);
}
