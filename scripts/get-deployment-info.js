// scripts/get-deployment-info.js
const { ethers } = require("hardhat");

async function getDeploymentInfo() {
  console.log("📋 Getting recent deployment info...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  
  console.log("\n🔍 Check your recent transactions on Sepolia Etherscan:");
  console.log(`https://sepolia.etherscan.io/address/${deployer.address}`);
  
  console.log("\n📝 Look for the most recent contract deployments");
  console.log("The VOLUME_V2 contract should be one of the recent 'Contract Creation' transactions");
  
  console.log("\n💡 Once you find the contract address, run:");
  console.log("npx hardhat run scripts/test-complete-functionality-interactive.js --network sepolia 0xYourContractAddress");
}

if (require.main === module) {
  getDeploymentInfo().catch(console.error);
}
