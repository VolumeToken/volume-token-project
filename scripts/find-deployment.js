// scripts/find-deployment.js
const { ethers } = require("hardhat");

async function findDeployment() {
  console.log("🔍 Finding your actual VOLUME V2 deployment...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("Your deployer address:", deployer.address);
  
  console.log("\n📋 Check your Sepolia Etherscan transactions:");
  console.log(`https://sepolia.etherscan.io/address/${deployer.address}`);
  
  console.log("\n🔍 Look for transactions with these patterns:");
  console.log("1. Contract Creation transactions");
  console.log("2. Recent transactions (last hour)");
  console.log("3. Contract addresses starting with 0x and 42 characters long");
  
  console.log("\n💡 Your VOLUME V2 contract should be:");
  console.log("- A 'Contract Creation' transaction");
  console.log("- Created recently");
  console.log("- Have the name 'VOLUME V2' when you click on it");
  
  console.log("\n❌ WRONG address format:");
  console.log("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (This is a wallet, not contract)");
  
  console.log("\n✅ CORRECT address format should look like:");
  console.log("0x1234567890abcdef1234567890abcdef12345678 (Your actual contract)");
  
  // Try to find recent deployments programmatically
  try {
    console.log("\n🔍 Checking if you can find VOLUME_V2 artifacts...");
    
    const provider = ethers.provider;
    const currentBlock = await provider.getBlockNumber();
    console.log("Current block:", currentBlock);
    
    console.log("\n📝 Manual steps:");
    console.log("1. Go to Sepolia Etherscan link above");
    console.log("2. Look for 'Contract Creation' transactions");
    console.log("3. Find the one that created VOLUME_V2");
    console.log("4. Copy that contract address");
    console.log("5. Run the test again with the correct address");
    
  } catch (error) {
    console.log("Could not check programmatically");
  }
}

if (require.main === module) {
  findDeployment().catch(console.error);
}
