// scripts/debug-router-transferfrom-deep.js
const { ethers } = require("hardhat");

async function debugRouterTransferFromDeep() {
  console.log("🔍 Deep debugging router transferFrom...\n");
  
  // REPLACE WITH YOUR CONTRACT ADDRESS
  const TOKEN_ADDRESS = "0x6DB1004550b50a466b1cDb158f6d79D156313444";
  
  const [deployer] = await ethers.getSigners();
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  
  const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
  const token = VOLUME_V2.attach(TOKEN_ADDRESS);
  
  try {
    console.log("=== 1. Check Current Allowances ===");
    
    const liquidityAmount = ethers.utils.parseEther("10000");
    
    // Check current allowances
    const routerAllowance = await token.allowance(deployer.address, ROUTER_ADDRESS);
    const selfAllowance = await token.allowance(deployer.address, deployer.address);
    
    console.log("Router allowance:", ethers.utils.formatEther(routerAllowance));
    console.log("Self allowance:", ethers.utils.formatEther(selfAllowance));
    console.log("Liquidity amount:", ethers.utils.formatEther(liquidityAmount));
    
    console.log("\n=== 2. Test Router TransferFrom Call Simulation ===");
    
    // Give fresh approval to router
    console.log("Setting fresh approval to router...");
    await token.approve(ROUTER_ADDRESS, liquidityAmount);
    
    const newAllowance = await token.allowance(deployer.address, ROUTER_ADDRESS);
    console.log("New router allowance:", ethers.utils.formatEther(newAllowance));
    
    // Try to simulate what the router does
    console.log("\n=== 3. Simulate Router Call ===");
    
    // The router internally calls transferFrom(user, router, amount)
    // But we can't call this as router, so let's check what happens when WE call it
    
    try {
      // This is what fails - calling transferFrom to move tokens to router
      console.log("Simulating router transferFrom call...");
      
      // But wait - the router should call this, not us
      // Let's check what the router actually does
      
      console.log("Checking what happens in _transfer when recipient is router...");
      
      // Try regular transfer to router first
      await token.transfer(ROUTER_ADDRESS, ethers.utils.parseEther("1000"));
      console.log("✅ Regular transfer to router works");
      
      // Now try transferFrom where we are the spender
      console.log("Testing transferFrom where we are spender...");
      
      // Reset allowance first
      await token.approve(deployer.address, liquidityAmount);
      
      // This should work since we're the spender
      await token.transferFrom(deployer.address, ROUTER_ADDRESS, ethers.utils.parseEther("1000"));
      console.log("✅ transferFrom to router works when we're the spender");
      
      console.log("\n=== 4. The Problem ===");
      console.log("The issue is that the ROUTER needs to call transferFrom, not us");
      console.log("But we can't impersonate the router on testnet");
      
    } catch (error) {
      console.log("❌ Transfer simulation failed:", error.message);
      
      // Check specific error details
      if (error.message.includes("insufficient allowance")) {
        console.log("🔍 Issue: Allowance problem in transferFrom");
      } else if (error.message.includes("paused")) {
        console.log("🔍 Issue: Contract is paused");
      } else if (error.message.includes("max")) {
        console.log("🔍 Issue: Anti-whale limits still active");
      } else {
        console.log("🔍 Issue: Unknown error in _transfer");
      }
    }
    
    console.log("\n=== 5. Check Contract State ===");
    
    console.log("Contract paused:", await token.paused());
    console.log("Fees enabled:", await token.feesEnabled());
    console.log("Anti-whale enabled:", await token.antiWhaleEnabled());
    
    const pairAddress = await token.uniswapV2Pair();
    console.log("Pair address:", pairAddress);
    console.log("Pair is set:", pairAddress !== ethers.constants.AddressZero);
    
    console.log("\n=== 6. Try Different Approach ===");
    console.log("Let's try smaller amounts to isolate the issue");
    
    // Try with very small amount
    const smallAmount = ethers.utils.parseEther("1");
    await token.approve(ROUTER_ADDRESS, smallAmount);
    
    try {
      await token.transferFrom(deployer.address, ROUTER_ADDRESS, smallAmount);
      console.log("✅ Small amount transferFrom works");
    } catch (error) {
      console.log("❌ Even small amount fails:", error.message);
    }
    
    console.log("\n=== 7. Check Our TransferFrom Implementation ===");
    
    // Let's check if there's an issue with our transferFrom implementation
    console.log("Let's look at the transferFrom function implementation issue...");
    
    // Check if the issue is in _spendAllowance or _transfer
    const balanceBefore = await token.balanceOf(deployer.address);
    console.log("Balance before:", ethers.utils.formatEther(balanceBefore));
    
    // Try to identify where exactly it fails
    console.log("\n❓ HYPOTHESIS: Our transferFrom function has a bug");
    console.log("Even though basic test works, router context might be different");
    
  } catch (error) {
    console.error("❌ Deep debug failed:", error.message);
  }
}

if (require.main === module) {
  debugRouterTransferFromDeep().catch(console.error);
}
