// scripts/test-address-approval-pattern.js
const { ethers } = require("hardhat");

async function testAddressApprovalPattern() {
  console.log("🔍 Testing address approval patterns...\n");
  
  try {
    const [deployer, user1] = await ethers.getSigners();
    
    // Use your working contract
    const TOKEN_ADDRESS = "0x5D3a740cb69Df9e36389C9DD2e2015F8408A3f52";
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    const token = VOLUME_V2.attach(TOKEN_ADDRESS);
    
    console.log("Testing contract:", TOKEN_ADDRESS);
    
    const testAmount = ethers.utils.parseEther("1000");
    
    const addressesToTest = [
      { name: "Self (deployer)", address: deployer.address },
      { name: "User1", address: user1.address },
      { name: "Router", address: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008" },
      { name: "Factory", address: "0x7E0987E5b3a30e3f2828572Bb659A548460a3003" },
      { name: "WETH", address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9" },
      { name: "Random Address", address: "0x1234567890123456789012345678901234567890" }
    ];
    
    console.log("=== Testing Raw Approve to Different Addresses ===\n");
    
    for (const target of addressesToTest) {
      try {
        console.log(`Testing approval to ${target.name}: ${target.address}`);
        
        // Reset previous allowance if any
        const resetData = token.interface.encodeFunctionData("approve", [target.address, 0]);
        await deployer.sendTransaction({
          to: token.address,
          data: resetData,
          gasLimit: 100000
        });
        
        // Try approve
        const approveData = token.interface.encodeFunctionData("approve", [target.address, testAmount]);
        const approveTx = await deployer.sendTransaction({
          to: token.address,
          data: approveData,
          gasLimit: 100000
        });
        await approveTx.wait();
        
        const allowance = await token.allowance(deployer.address, target.address);
        console.log(`✅ ${target.name} allowance:`, ethers.utils.formatEther(allowance));
        
        if (allowance.eq(0)) {
          console.log(`❌ ${target.name} approve FAILED`);
          
          // Check if this address is blacklisted or has restrictions
          if (token.blacklisted) {
            const isBlacklisted = await token.blacklisted(target.address);
            console.log(`   Blacklisted: ${isBlacklisted}`);
          }
        }
        
      } catch (error) {
        console.log(`❌ ${target.name} error:`, error.message);
      }
      
      console.log(""); // Empty line for readability
    }
    
    console.log("=== Analysis ===");
    console.log("Check which addresses work and which don't to find the pattern");
    
    console.log("\n=== Test Custom Logic Interference ===");
    
    // Check if _transfer is somehow being called during approve
    const balanceBefore = await token.balanceOf(deployer.address);
    
    // Try approve to router again
    const routerApproveData = token.interface.encodeFunctionData("approve", ["0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008", testAmount]);
    await deployer.sendTransaction({
      to: token.address,
      data: routerApproveData,
      gasLimit: 100000
    });
    
    const balanceAfter = await token.balanceOf(deployer.address);
    console.log("Balance before router approve:", ethers.utils.formatEther(balanceBefore));
    console.log("Balance after router approve:", ethers.utils.formatEther(balanceAfter));
    
    if (!balanceBefore.eq(balanceAfter)) {
      console.log("🚨 CRITICAL: Approve is moving tokens! _transfer being called during approve");
    } else {
      console.log("✅ Approve doesn't move tokens - not calling _transfer");
    }
    
    console.log("\n=== Check Contract State ===");
    console.log("Anti-whale enabled:", await token.antiWhaleEnabled());
    console.log("Max TX amount:", ethers.utils.formatEther(await token.maxTxAmount()));
    console.log("Paused:", await token.paused());
    console.log("Router fee exempt:", await token.feeExempt("0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008"));
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testAddressApprovalPattern().catch(console.error);
}
