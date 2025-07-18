// scripts/debug-router-transferfrom-fixed.js
const { ethers } = require("hardhat");

async function debugRouterTransferFrom() {
  console.log("🔍 Debugging router transferFrom issue...\n");
  
  // REPLACE THIS WITH YOUR ACTUAL CONTRACT ADDRESS
  const TOKEN_ADDRESS = "0x6DB1004550b50a466b1cDb158f6d79D156313444";
  
//  if (TOKEN_ADDRESS === "0x6DB1004550b50a466b1cDb158f6d79D156313444") {
//   console.log("❌ Please update TOKEN_ADDRESS in the script with your actual contract address");
//    console.log("Edit scripts/debug-router-transferfrom-fixed.js and replace the TOKEN_ADDRESS");
//    return;
//  }
  
  const [deployer] = await ethers.getSigners();
  const ROUTER_ADDRESS = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
  
  const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
  const token = VOLUME_V2.attach(TOKEN_ADDRESS);
  
  try {
    console.log("Testing contract:", TOKEN_ADDRESS);
    
    console.log("\n=== 1. Check Current State ===");
    const balance = await token.balanceOf(deployer.address);
    console.log("Your balance:", ethers.utils.formatEther(balance));
    
    console.log("\n=== 2. Check Router Exemptions ===");
    console.log("Router max wallet exempt:", await token.maxWalletExempt(ROUTER_ADDRESS));
    console.log("Router max tx exempt:", await token.maxTxExempt(ROUTER_ADDRESS));
    console.log("Router fee exempt:", await token.feeExempt(ROUTER_ADDRESS));
    console.log("Router anti-dump exempt:", await token.antiDumpExempt(ROUTER_ADDRESS));
    
    console.log("\n=== 3. Check Anti-whale Limits ===");
    const maxTx = await token.maxTxAmount();
    const maxWallet = await token.maxWalletAmount();
    console.log("Max TX amount:", ethers.utils.formatEther(maxTx));
    console.log("Max wallet amount:", ethers.utils.formatEther(maxWallet));
    
    const testAmount = ethers.utils.parseEther("10000"); // Liquidity amount
    console.log("Test amount:", ethers.utils.formatEther(testAmount));
    console.log("Amount > Max TX?", testAmount.gt(maxTx));
    console.log("Amount > Max Wallet?", testAmount.gt(maxWallet));
    
    // Check router balance
    const routerBalance = await token.balanceOf(ROUTER_ADDRESS);
    console.log("Router current balance:", ethers.utils.formatEther(routerBalance));
    console.log("Router balance + amount > max wallet?", routerBalance.add(testAmount).gt(maxWallet));
    
    console.log("\n=== 4. Test Direct TransferFrom ===");
    
    // Approve router
    console.log("Approving router...");
    await token.approve(ROUTER_ADDRESS, testAmount);
    
    const allowance = await token.allowance(deployer.address, ROUTER_ADDRESS);
    console.log("Router allowance:", ethers.utils.formatEther(allowance));
    
    if (allowance.gte(testAmount)) {
      try {
        // Try transferFrom to router
        console.log("Testing transferFrom to router...");
        await token.transferFrom(deployer.address, ROUTER_ADDRESS, ethers.utils.parseEther("1000"));
        console.log("✅ TransferFrom to router works!");
        
      } catch (error) {
        console.log("❌ TransferFrom to router failed:", error.message);
        
        // This tells us what the issue is
        if (error.message.includes("max transaction")) {
          console.log("🔍 Issue: Max transaction limit hit - router not exempt");
        } else if (error.message.includes("max wallet")) {
          console.log("🔍 Issue: Max wallet limit hit - router not exempt");
        } else if (error.message.includes("insufficient allowance")) {
          console.log("🔍 Issue: Allowance problem");
        } else {
          console.log("🔍 Issue: Unknown -", error.message);
        }
      }
    }
    
    console.log("\n=== 5. Recommendation ===");
    console.log("Run the exemption fix script to resolve this issue");
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugRouterTransferFrom().catch(console.error);
}
