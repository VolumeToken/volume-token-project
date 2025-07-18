// scripts/debug-network-context.js
const { ethers } = require("hardhat");

async function debugNetworkContext() {
  console.log("🔍 Debugging network context...\n");
  
  try {
    // Check what network we're actually on
    const network = await ethers.provider.getNetwork();
    console.log("Current network:", network.name);
    console.log("Chain ID:", network.chainId);
    console.log("Is Sepolia:", network.chainId === 11155111);
    console.log("Is local:", network.chainId === 31337);
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer address:", deployer.address);
    
    // Check ETH balance (will be different on Sepolia vs local)
    const balance = await deployer.getBalance();
    console.log("ETH balance:", ethers.utils.formatEther(balance));
    
    if (network.chainId === 11155111) {
      console.log("🚨 RUNNING ON SEPOLIA!");
      console.log("This explains why 'local test' fails - it's not actually local");
    } else {
      console.log("✅ Running on local network");
    }
    
    console.log("\n=== Test on Current Network ===");
    
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    
    const testAmount = ethers.utils.parseEther("10000");
    
    console.log("Testing approve on", network.name, "...");
    await token.approve(deployer.address, testAmount);
    const allowance = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance on", network.name + ":", ethers.utils.formatEther(allowance));
    
    if (allowance.eq(0)) {
      console.log("❌ Approve fails on", network.name);
      
      if (network.chainId === 11155111) {
        console.log("🔍 The issue is specific to Sepolia network!");
        console.log("Your contract works locally but fails on Sepolia");
      }
    } else {
      console.log("✅ Approve works on", network.name);
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugNetworkContext().catch(console.error);
}
