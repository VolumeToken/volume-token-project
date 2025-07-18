// scripts/emergency-fix-transferfrom.js
const { ethers } = require("hardhat");

async function emergencyFixTransferFrom() {
  console.log("🚨 Emergency fix for transferFrom issue...\n");
  
  const [deployer] = await ethers.getSigners();
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== 1. Check if Owner Can Fix This ===");
    
    const owner = await token.owner();
    console.log("Token owner:", owner);
    console.log("Deployer:", deployer.address);
    console.log("Is deployer owner?", owner.toLowerCase() === deployer.address.toLowerCase());
    
    if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
      console.log("❌ You're not the owner - can't fix this");
      return;
    }
    
    console.log("\n=== 2. Check for Fix Functions ===");
    
    // Check if there are any emergency functions
    const fixFunctions = [
      'enableTransferFrom',
      'disableTransferRestrictions', 
      'emergencyUnlock',
      'setTransferFromEnabled',
      'fixTransferFrom',
      'disableAntiDump',
      'emergencyDisableAllRestrictions'
    ];
    
    for (const func of fixFunctions) {
      try {
        await token[func]();
        console.log(`✅ ${func} executed successfully`);
        
        // Test transferFrom after each fix attempt
        const testAmount = ethers.utils.parseEther("1");
        await token.approve(ROUTER_ADDRESS, testAmount);
        await token.transferFrom(deployer.address, deployer.address, testAmount);
        console.log(`✅ transferFrom works after ${func}!`);
        return;
        
      } catch (e) {
        console.log(`❌ ${func} not available or failed:`, e.message);
      }
    }
    
    console.log("\n=== 3. Try Disabling All Restrictions ===");
    
    // Try to disable everything that might interfere
    const disableFunctions = [
      { func: 'setAntiDumpEnabled', args: [false] },
      { func: 'setMaxWalletEnabled', args: [false] },
      { func: 'setMaxTxEnabled', args: [false] },
      { func: 'setFeesEnabled', args: [false] },
      { func: 'setTransferRestrictions', args: [false] },
      { func: 'pause', args: [] },
      { func: 'unpause', args: [] }
    ];
    
    for (const { func, args } of disableFunctions) {
      try {
        await token[func](...args);
        console.log(`✅ ${func} executed`);
      } catch (e) {
        console.log(`❌ ${func} failed:`, e.message);
      }
    }
    
    console.log("\n=== 4. Test transferFrom After All Fixes ===");
    
    const testAmount = ethers.utils.parseEther("1");
    
    // Fresh approval
    await token.approve(ROUTER_ADDRESS, testAmount.mul(2));
    const allowance = await token.allowance(deployer.address, ROUTER_ADDRESS);
    console.log("Fresh allowance:", ethers.utils.formatEther(allowance));
    
    try {
      await token.transferFrom(deployer.address, deployer.address, testAmount);
      console.log("✅ transferFrom now works!");
    } catch (e) {
      console.log("❌ transferFrom still broken:", e.message);
    }
    
    console.log("\n=== 5. Nuclear Option: Disable Contract ===");
    
    // If nothing works, the contract is fundamentally broken
    console.log("🚨 CONTRACT HAS BROKEN TRANSFERFROM IMPLEMENTATION");
    console.log("🚨 This means:");
    console.log("   - No Uniswap trading (selling) will work");
    console.log("   - No DeFi integrations will work");
    console.log("   - Only direct transfers work");
    
    console.log("\n🔧 SOLUTIONS:");
    console.log("1. Fix the contract source code and redeploy");
    console.log("2. Use only direct transfers (no Uniswap)");
    console.log("3. Deploy a new fixed version");
    
  } catch (error) {
    console.error("❌ Emergency fix failed:", error.message);
  }
}

if (require.main === module) {
  emergencyFixTransferFrom().catch(console.error);
}
