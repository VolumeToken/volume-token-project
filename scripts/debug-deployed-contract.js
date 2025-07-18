// scripts/debug-deployed-contract.js
const { ethers } = require("hardhat");

async function debugDeployedContract() {
  console.log("🔍 Debugging deployed contract thoroughly...\n");
  
  const TOKEN_ADDRESS = "0x90b2BAd3Bf208A0Ca19Ec96f3A9054B2BA565ce3";
  const [deployer] = await ethers.getSigners();
  
  try {
    // Connect to deployed contract
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    const token = VOLUME_V2.attach(TOKEN_ADDRESS);
    
    console.log("=== 1. Basic Contract Verification ===");
    console.log("Contract address:", TOKEN_ADDRESS);
    console.log("Token name:", await token.name());
    console.log("Token symbol:", await token.symbol());
    console.log("Your balance:", ethers.utils.formatEther(await token.balanceOf(deployer.address)));
    
    console.log("\n=== 2. Test Approve Function Step by Step ===");
    
    const testAmount = ethers.utils.parseEther("10000");
    
    // Check current allowance
    const allowanceBefore = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance before approve:", ethers.utils.formatEther(allowanceBefore));
    
    // Try approve with explicit gas limit
    console.log("Attempting approve with gas limit...");
    try {
      const approveTx = await token.approve(deployer.address, testAmount, { gasLimit: 100000 });
      const receipt = await approveTx.wait();
      console.log("✅ Approve transaction successful");
      console.log("Gas used:", receipt.gasUsed.toString());
    } catch (approveError) {
      console.log("❌ Approve transaction failed:", approveError.message);
      return;
    }
    
    // Check allowance after approve
    const allowanceAfter = await token.allowance(deployer.address, deployer.address);
    console.log("Allowance after approve:", ethers.utils.formatEther(allowanceAfter));
    
    if (allowanceAfter.eq(0)) {
      console.log("🚨 CRITICAL: Approve function is not working!");
      console.log("The approve transaction succeeded but allowance is still 0");
      console.log("This suggests the deployed contract is different from local");
    }
    
    console.log("\n=== 3. Check Contract Code ===");
    
    // Check if the contract has the expected bytecode
    const deployedCode = await ethers.provider.getCode(TOKEN_ADDRESS);
    console.log("Deployed contract bytecode length:", deployedCode.length);
    
    // Check if transferFrom is in the bytecode
    const hasTransferFrom = deployedCode.includes("23b872dd"); // transferFrom selector
    console.log("Has transferFrom in bytecode:", hasTransferFrom);
    
    console.log("\n=== 4. Test Different Approve Amounts ===");
    
    // Try different amounts
    const amounts = [
      ethers.utils.parseEther("1"),
      ethers.utils.parseEther("100"),
      ethers.utils.parseEther("1000")
    ];
    
    for (const amount of amounts) {
      try {
        console.log(`Testing approve with ${ethers.utils.formatEther(amount)}...`);
        
        await token.approve(deployer.address, amount);
        const allowance = await token.allowance(deployer.address, deployer.address);
        console.log(`Result: ${ethers.utils.formatEther(allowance)}`);
        
        if (allowance.gt(0)) {
          console.log("✅ Approve works with this amount");
          break;
        }
      } catch (error) {
        console.log(`❌ Failed with ${ethers.utils.formatEther(amount)}: ${error.message}`);
      }
    }
    
    console.log("\n=== 5. Check if Contract is Paused or Restricted ===");
    
    try {
      console.log("Contract paused:", await token.paused());
      console.log("Fees enabled:", await token.feesEnabled());
      console.log("Anti-whale enabled:", await token.antiWhaleEnabled());
      console.log("Contract owner:", await token.owner());
      console.log("Is owner:", (await token.owner()) === deployer.address);
    } catch (error) {
      console.log("Could not check contract state:", error.message);
    }
    
    console.log("\n=== 6. DIAGNOSIS ===");
    console.log("🔍 The deployed contract appears to have issues with:");
    console.log("1. The approve function not working");
    console.log("2. Possible deployment mismatch");
    console.log("3. Contract state issues");
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugDeployedContract().catch(console.error);
}
