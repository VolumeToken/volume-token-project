// scripts/debug-deployed-v2.js
const { ethers } = require("hardhat");

async function debugDeployedV2() {
  console.log("🔍 Debugging deployed V2 contract...\n");
  
  // Replace with your deployed V2 address
  const TOKEN_ADDRESS = "0x2ef239B9D79247Dcc5e12B87471E6690Db990031";
  
  const [deployer] = await ethers.getSigners();
  
  try {
    // Try to connect to the deployed contract
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    const token = VOLUME_V2.attach(TOKEN_ADDRESS);
    
    console.log("=== 1. Basic Contract Info ===");
    console.log("Contract address:", TOKEN_ADDRESS);
    console.log("Token name:", await token.name());
    console.log("Token symbol:", await token.symbol());
    console.log("Total supply:", ethers.utils.formatEther(await token.totalSupply()));
    
    console.log("\n=== 2. Test Approve Function ===");
    
    const testAmount = ethers.utils.parseEther("1000");
    
    // Check balance first
    const balance = await token.balanceOf(deployer.address);
    console.log("Deployer balance:", ethers.utils.formatEther(balance));
    
    // Check allowance before approve
    const allowanceBefore = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance before approve:", ethers.utils.formatEther(allowanceBefore));
    
    // Try approve
    console.log("Attempting approve...");
    const approveTx = await token.approve(deployer.address, testAmount);
    await approveTx.wait();
    console.log("✅ Approve transaction completed");
    
    // Check allowance after approve
    const allowanceAfter = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance after approve:", ethers.utils.formatEther(allowanceAfter));
    
    if (allowanceAfter.lt(testAmount)) {
      console.log("❌ Approve didn't work properly!");
      console.log("Expected:", ethers.utils.formatEther(testAmount));
      console.log("Actual:", ethers.utils.formatEther(allowanceAfter));
    }
    
    console.log("\n=== 3. Check if Contract has transferFrom Override ===");
    
    // Test if the contract has the transferFrom function we added
    try {
      // This will tell us if our custom transferFrom is there
      const contractCode = await ethers.provider.getCode(TOKEN_ADDRESS);
      console.log("Contract code length:", contractCode.length);
      
      // Check if transferFrom function exists
      if (contractCode.includes("transferFrom")) {
        console.log("✅ Contract has transferFrom function");
      } else {
        console.log("❌ Contract missing transferFrom function");
      }
      
    } catch (error) {
      console.log("Code check failed:", error.message);
    }
    
    console.log("\n=== 4. Try transferFrom with Very Small Amount ===");
    
    if (allowanceAfter.gt(0)) {
      try {
        const smallAmount = ethers.utils.parseEther("0.001");
        console.log("Trying transferFrom with:", ethers.utils.formatEther(smallAmount));
        
        await token.transferFrom(deployer.address, deployer.address, smallAmount);
        console.log("✅ transferFrom worked!");
        
      } catch (error) {
        console.log("❌ transferFrom failed:", error.message);
      }
    }
    
    console.log("\n=== 5. Contract Deployment Verification ===");
    
    // Check if this is actually the V2 contract
    try {
      const owner = await token.owner();
      console.log("Contract owner:", owner);
      console.log("Deployer:", deployer.address);
      console.log("Is deployer owner:", owner.toLowerCase() === deployer.address.toLowerCase());
      
    } catch (error) {
      console.log("Owner check failed:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugDeployedV2().catch(console.error);
}
