// scripts/test-approval-pattern-fixed.js
const { ethers } = require("hardhat");

async function testApprovalPatternFixed() {
  console.log("🔍 Testing approval patterns (fixed)...\n");
  
  try {
    const [deployer] = await ethers.getSigners();
    
    // Use your working contract
    const TOKEN_ADDRESS = "0x5D3a740cb69Df9e36389C9DD2e2015F8408A3f52";
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    const token = VOLUME_V2.attach(TOKEN_ADDRESS);
    
    console.log("Testing contract:", TOKEN_ADDRESS);
    console.log("Deployer:", deployer.address);
    
    const testAmount = ethers.utils.parseEther("1000");
    
    const addressesToTest = [
      { name: "Self (deployer)", address: deployer.address },
      { name: "Router", address: "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008" },
      { name: "Factory", address: "0x7E0987E5b3a30e3f2828572Bb659A548460a3003" },
      { name: "WETH", address: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9" },
      { name: "Zero Address", address: ethers.constants.AddressZero },
      { name: "Contract Address", address: TOKEN_ADDRESS }
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
        console.log(`Result: ${ethers.utils.formatEther(allowance)}`);
        
        if (allowance.eq(0)) {
          console.log(`❌ ${target.name} approve FAILED`);
          
          // Check exemption status
          try {
            const isExempt = await token.feeExempt(target.address);
            console.log(`   Fee exempt: ${isExempt}`);
          } catch (e) {}
          
          // Check if blacklisted
          try {
            const isBlacklisted = await token.blacklisted(target.address);
            console.log(`   Blacklisted: ${isBlacklisted}`);
          } catch (e) {}
          
        } else {
          console.log(`✅ ${target.name} approve WORKS`);
        }
        
      } catch (error) {
        console.log(`❌ ${target.name} error:`, error.message);
      }
      
      console.log(""); // Empty line for readability
    }
    
    console.log("=== Check Anti-Whale Logic ===");
    
    const maxTx = await token.maxTxAmount();
    const maxWallet = await token.maxWalletAmount();
    console.log("Max TX amount:", ethers.utils.formatEther(maxTx));
    console.log("Max wallet amount:", ethers.utils.formatEther(maxWallet));
    console.log("Test amount:", ethers.utils.formatEther(testAmount));
    console.log("Test amount > Max TX:", testAmount.gt(maxTx));
    console.log("Test amount > Max Wallet:", testAmount.gt(maxWallet));
    
    console.log("\n=== Check _transfer Override Issues ===");
    
    // Check if approve somehow calls _transfer
    const balanceBefore = await token.balanceOf(deployer.address);
    
    // Try approve to router again with debugging
    console.log("Testing router approve with balance tracking...");
    const routerApproveData = token.interface.encodeFunctionData("approve", ["0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008", testAmount]);
    
    const routerApproveTx = await deployer.sendTransaction({
      to: token.address,
      data: routerApproveData,
      gasLimit: 100000
    });
    
    const receipt = await routerApproveTx.wait();
    console.log("Router approve gas used:", receipt.gasUsed.toString());
    console.log("Router approve events count:", receipt.events?.length || 0);
    
    const balanceAfter = await token.balanceOf(deployer.address);
    const routerAllowance = await token.allowance(deployer.address, "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008");
    
    console.log("Balance before:", ethers.utils.formatEther(balanceBefore));
    console.log("Balance after:", ethers.utils.formatEther(balanceAfter));
    console.log("Router allowance:", ethers.utils.formatEther(routerAllowance));
    
    if (!balanceBefore.eq(balanceAfter)) {
      console.log("🚨 CRITICAL: Approve moved tokens - _transfer called during approve!");
    } else {
      console.log("✅ Approve didn't move tokens");
    }
    
    if (receipt.events && receipt.events.length > 0) {
      console.log("\nEvents emitted:");
      receipt.events.forEach((event, i) => {
        console.log(`Event ${i}:`, event.event, event.args);
      });
    } else {
      console.log("❌ No Approval event emitted - this is the bug!");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testApprovalPatternFixed().catch(console.error);
}
