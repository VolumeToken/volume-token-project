// scripts/debug-allowance-deep.js
const { ethers } = require("hardhat");

async function debugAllowanceDeep() {
  console.log("🔍 Deep allowance debugging...\n");
  
  const [deployer] = await ethers.getSigners();
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== 1. Check Current State ===");
    console.log("Deployer:", deployer.address);
    console.log("Router:", ROUTER_ADDRESS);
    console.log("Token:", TOKEN_ADDRESS);
    
    const balance = await token.balanceOf(deployer.address);
    console.log("Deployer balance:", ethers.utils.formatEther(balance));
    
    console.log("\n=== 2. Test Standard ERC20 Functions ===");
    
    // Test if approve works at all
    console.log("Testing approve with 1000 tokens...");
    const approveAmount = ethers.utils.parseEther("1000");
    
    const approveTx = await token.approve(ROUTER_ADDRESS, approveAmount);
    await approveTx.wait();
    console.log("✅ Approve transaction successful");
    
    // Check allowance immediately after approve
    const allowanceAfterApprove = await token.allowance(deployer.address, ROUTER_ADDRESS);
    console.log("Allowance after approve:", ethers.utils.formatEther(allowanceAfterApprove));
    
    if (allowanceAfterApprove.lt(approveAmount)) {
      console.log("⚠️  Allowance is less than approved amount!");
    }
    
    console.log("\n=== 3. Test increaseAllowance ===");
    
    try {
      const increaseAmount = ethers.utils.parseEther("500");
      await token.increaseAllowance(ROUTER_ADDRESS, increaseAmount);
      console.log("✅ increaseAllowance successful");
      
      const allowanceAfterIncrease = await token.allowance(deployer.address, ROUTER_ADDRESS);
      console.log("Allowance after increase:", ethers.utils.formatEther(allowanceAfterIncrease));
      
    } catch (increaseError) {
      console.log("❌ increaseAllowance failed:", increaseError.message);
    }
    
    console.log("\n=== 4. Test transferFrom with Self ===");
    
    // Try transferFrom from deployer to deployer (should work if allowance is set)
    const testAmount = ethers.utils.parseEther("1");
    const finalAllowance = await token.allowance(deployer.address, ROUTER_ADDRESS);
    
    console.log("Final allowance:", ethers.utils.formatEther(finalAllowance));
    console.log("Test amount:", ethers.utils.formatEther(testAmount));
    
    if (finalAllowance.gte(testAmount)) {
      try {
        // This should work - transferFrom deployer to deployer using router's allowance
        await token.transferFrom(deployer.address, deployer.address, testAmount);
        console.log("✅ transferFrom to self successful");
      } catch (selfTransferError) {
        console.log("❌ transferFrom to self failed:", selfTransferError.message);
      }
    } else {
      console.log("⚠️  Allowance insufficient for test");
    }
    
    console.log("\n=== 5. Check for Custom Transfer Logic ===");
    
    // Try to understand if the VOLUME contract has custom transfer logic
    try {
      console.log("Checking if token has custom transfer restrictions...");
      
      // Test a simple transfer first
      const simpleTransferAmount = ethers.utils.parseEther("10");
      const balanceBeforeTransfer = await token.balanceOf(deployer.address);
      
      await token.transfer(deployer.address, simpleTransferAmount);
      console.log("✅ Self-transfer successful");
      
      const balanceAfterTransfer = await token.balanceOf(deployer.address);
      console.log("Balance change:", ethers.utils.formatEther(balanceAfterTransfer.sub(balanceBeforeTransfer)));
      
    } catch (transferError) {
      console.log("❌ Even simple transfer failed:", transferError.message);
    }
    
    console.log("\n=== 6. Alternative: Direct Router Interaction ===");
    
    // Try to bypass the allowance issue by using the router differently
    console.log("Let's try working around the allowance issue...");
    
    // Check if the router has any special functions
    const routerABI = [
      "function WETH() external pure returns (address)",
      "function factory() external pure returns (address)"
    ];
    
    const router = new ethers.Contract(ROUTER_ADDRESS, routerABI, deployer);
    
    try {
      console.log("Router WETH:", await router.WETH());
      console.log("Router factory:", await router.factory());
      console.log("✅ Router is responsive");
    } catch (routerError) {
      console.log("❌ Router connection failed:", routerError.message);
    }
    
  } catch (error) {
    console.error("❌ Deep debug failed:", error.message);
  }
}

if (require.main === module) {
  debugAllowanceDeep().catch(console.error);
}
