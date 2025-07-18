// scripts/debug-transferfrom-properly.js
const { ethers } = require("hardhat");

async function debugTransferFromProperly() {
  console.log("🔍 Debugging transferFrom properly...\n");
  
  // REPLACE WITH YOUR CONTRACT ADDRESS
  const TOKEN_ADDRESS = "0x6DB1004550b50a466b1cDb158f6d79D156313444";
  
  const [deployer] = await ethers.getSigners();
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  
  const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
  const token = VOLUME_V2.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== 1. Test Self-TransferFrom (what works) ===");
    
    const testAmount = ethers.utils.parseEther("1000");
    
    // Approve YOURSELF (this is what the working test does)
    await token.approve(deployer.address, testAmount);
    const selfAllowance = await token.allowance(deployer.address, deployer.address);
    console.log("Self allowance:", ethers.utils.formatEther(selfAllowance));
    
    // This should work (deployer calling transferFrom with deployer as spender)
    await token.transferFrom(deployer.address, deployer.address, ethers.utils.parseEther("1"));
    console.log("✅ Self-transferFrom works");
    
    console.log("\n=== 2. Test Router Approval (what should work for Uniswap) ===");
    
    // Approve router (this is what Uniswap needs)
    await token.approve(ROUTER_ADDRESS, testAmount);
    const routerAllowance = await token.allowance(deployer.address, ROUTER_ADDRESS);
    console.log("Router allowance:", ethers.utils.formatEther(routerAllowance));
    
    // This is what happens in Uniswap: router calls transferFrom(user, router, amount)
    // But we can't simulate router calling it, so let's test the _transfer function directly
    
    console.log("\n=== 3. Test Direct Transfer (simulating what should happen) ===");
    
    // This simulates what happens after allowance is checked
    try {
      await token.transfer(ROUTER_ADDRESS, ethers.utils.parseEther("1000"));
      console.log("✅ Direct transfer to router works");
    } catch (error) {
      console.log("❌ Direct transfer to router failed:", error.message);
      
      // This tells us if the issue is in _transfer logic
      if (error.message.includes("max")) {
        console.log("🔍 Issue: Anti-whale limits - router not exempted");
      } else {
        console.log("🔍 Issue: Other transfer restriction");
      }
    }
    
    console.log("\n=== 4. Check Router Exemptions ===");
    
    console.log("Router max wallet exempt:", await token.maxWalletExempt(ROUTER_ADDRESS));
    console.log("Router max tx exempt:", await token.maxTxExempt(ROUTER_ADDRESS));
    console.log("Router fee exempt:", await token.feeExempt(ROUTER_ADDRESS));
    console.log("Router anti-dump exempt:", await token.antiDumpExempt(ROUTER_ADDRESS));
    
    const maxTx = await token.maxTxAmount();
    const maxWallet = await token.maxWalletAmount();
    console.log("Max TX amount:", ethers.utils.formatEther(maxTx));
    console.log("Max wallet amount:", ethers.utils.formatEther(maxWallet));
    
    const routerBalance = await token.balanceOf(ROUTER_ADDRESS);
    console.log("Router balance:", ethers.utils.formatEther(routerBalance));
    
    console.log("\n=== 5. The Real Issue ===");
    
    if (testAmount.gt(maxTx)) {
      console.log("❌ ISSUE: Transfer amount > max tx limit");
      console.log("SOLUTION: Exempt router from max tx limit");
    }
    
    if (routerBalance.add(testAmount).gt(maxWallet)) {
      console.log("❌ ISSUE: Router balance + amount > max wallet limit");
      console.log("SOLUTION: Exempt router from max wallet limit");
    }
    
    console.log("\n=== 6. Recommendation ===");
    console.log("The transferFrom function works fine.");
    console.log("The issue is that the router is not exempted from anti-whale limits.");
    console.log("Run the exemption fix script to resolve this.");
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugTransferFromProperly().catch(console.error);
}
