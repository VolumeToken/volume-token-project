// scripts/debug-sepolia-deployment.js
const { ethers } = require("hardhat");

async function debugSepoliaDeployment() {
  console.log("🔍 Debugging what's actually deployed on Sepolia...\n");
  
  try {
    // Check if we're on Sepolia
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 11155111) {
      console.log("❌ This script must be run with --network sepolia");
      return;
    }
    
    console.log("✅ Running on Sepolia");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("ETH balance:", ethers.utils.formatEther(await deployer.getBalance()));
    
    console.log("\n=== Deploy Fresh Contract on Sepolia ===");
    
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    console.log("Local bytecode length:", VOLUME_V2.bytecode.length);
    
    // Deploy new contract
    console.log("Deploying fresh contract...");
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    
    console.log("Waiting for deployment...");
    await token.deployed();
    console.log("✅ Fresh contract deployed:", token.address);
    
    // Check deployed bytecode
    const deployedBytecode = await ethers.provider.getCode(token.address);
    console.log("Deployed bytecode length:", deployedBytecode.length);
    console.log("Bytecodes match:", VOLUME_V2.bytecode.length === deployedBytecode.length);
    
    console.log("\n=== Test Fresh Contract ===");
    
    const testAmount = ethers.utils.parseEther("10000");
    
    console.log("Testing approve on fresh Sepolia deployment...");
    
    try {
      // Try with explicit gas limit
      const approveTx = await token.approve(deployer.address, testAmount, {
        gasLimit: 100000
      });
      console.log("Approve tx hash:", approveTx.hash);
      
      const receipt = await approveTx.wait();
      console.log("Approve tx mined, gas used:", receipt.gasUsed.toString());
      
      const allowance = await token.allowance(deployer.address, deployer.address);
      console.log("Fresh contract allowance:", ethers.utils.formatEther(allowance));
      
      if (allowance.eq(0)) {
        console.log("❌ Even fresh deployment fails on Sepolia!");
        console.log("This suggests a fundamental issue with the contract on Sepolia");
      } else {
        console.log("✅ Fresh deployment works on Sepolia!");
        console.log("Previous issue was with old deployment");
      }
      
    } catch (error) {
      console.log("❌ Approve failed on fresh deployment:", error.message);
      
      if (error.message.includes("gas")) {
        console.log("🔍 Gas-related issue on Sepolia");
      } else if (error.message.includes("revert")) {
        console.log("🔍 Contract logic issue on Sepolia");
      }
    }
    
    console.log("\n📋 Fresh Contract Info:");
    console.log("Address:", token.address);
    console.log("Etherscan:", `https://sepolia.etherscan.io/address/${token.address}`);
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugSepoliaDeployment().catch(console.error);
}
