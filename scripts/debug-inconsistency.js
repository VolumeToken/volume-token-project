// scripts/debug-inconsistency.js
const { ethers } = require("hardhat");

async function debugInconsistency() {
  console.log("🔍 Debugging the inconsistency...\n");
  
  try {
    const [deployer] = await ethers.getSigners();
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    
    console.log("=== Test 1: Exact Same as Working Debug ===");
    
    const token1 = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token1.deployed();
    
    const testAmount1 = ethers.utils.parseEther("1000"); // Same as working debug
    console.log("Deploying and testing with 1000 tokens...");
    
    await token1.approve(deployer.address, testAmount1);
    const allowance1 = await token1.allowance(deployer.address, deployer.address);
    console.log("Result 1 - Allowance:", ethers.utils.formatEther(allowance1));
    
    console.log("\n=== Test 2: Exact Same as Failing Deploy ===");
    
    const token2 = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token2.deployed();
    
    const testAmount2 = ethers.utils.parseEther("10000"); // Same as failing deploy
    console.log("Deploying and testing with 10000 tokens...");
    
    await token2.approve(deployer.address, testAmount2);
    const allowance2 = await token2.allowance(deployer.address, deployer.address);
    console.log("Result 2 - Allowance:", ethers.utils.formatEther(allowance2));
    
    console.log("\n=== Test 3: Check Anti-Whale Limits ===");
    
    const maxTx = await token2.maxTxAmount();
    const maxWallet = await token2.maxWalletAmount();
    console.log("Max TX amount:", ethers.utils.formatEther(maxTx));
    console.log("Max wallet amount:", ethers.utils.formatEther(maxWallet));
    console.log("Test amount:", ethers.utils.formatEther(testAmount2));
    console.log("Test amount > Max TX:", testAmount2.gt(maxTx));
    console.log("Test amount > Max Wallet:", testAmount2.gt(maxWallet));
    
    console.log("\n=== Test 4: Check if _transfer is Being Called ===");
    
    // The approve function might be calling _transfer somehow
    console.log("Checking if approve triggers _transfer...");
    
    const balance1 = await token2.balanceOf(deployer.address);
    console.log("Balance before approve:", ethers.utils.formatEther(balance1));
    
    // Set a very large allowance to see if it triggers anti-whale
    const largeAmount = ethers.utils.parseEther("1000000");
    console.log("Testing with very large amount:", ethers.utils.formatEther(largeAmount));
    
    try {
      await token2.approve(deployer.address, largeAmount);
      const largeAllowance = await token2.allowance(deployer.address, deployer.address);
      console.log("Large amount allowance:", ethers.utils.formatEther(largeAllowance));
    } catch (error) {
      console.log("Large amount failed:", error.message);
    }
    
    const balance2 = await token2.balanceOf(deployer.address);
    console.log("Balance after approve:", ethers.utils.formatEther(balance2));
    console.log("Balance changed:", !balance1.eq(balance2));
    
    console.log("\n=== Test 5: Step by Step Approve ===");
    
    // Let's trace exactly what happens in approve
    console.log("Step-by-step approve process:");
    
    const token3 = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token3.deployed();
    
    // Check initial state
    console.log("1. Initial allowance:", ethers.utils.formatEther(await token3.allowance(deployer.address, deployer.address)));
    
    // Check if deployer is exempt
    console.log("2. Deployer max tx exempt:", await token3.maxTxExempt(deployer.address));
    console.log("3. Deployer max wallet exempt:", await token3.maxWalletExempt(deployer.address));
    console.log("4. Deployer fee exempt:", await token3.feeExempt(deployer.address));
    
    // Try approve with gas estimation
    console.log("5. Estimating gas for approve...");
    try {
      const gasEstimate = await token3.estimateGas.approve(deployer.address, testAmount2);
      console.log("Gas estimate:", gasEstimate.toString());
    } catch (gasError) {
      console.log("Gas estimation failed:", gasError.message);
    }
    
    // Do the approve
    console.log("6. Executing approve...");
    const approveTx = await token3.approve(deployer.address, testAmount2);
    console.log("Approve tx hash:", approveTx.hash);
    
    const receipt = await approveTx.wait();
    console.log("7. Transaction mined, gas used:", receipt.gasUsed.toString());
    console.log("8. Events count:", receipt.events?.length || 0);
    
    if (receipt.events) {
      receipt.events.forEach((event, i) => {
        console.log(`Event ${i}:`, event.event, event.args?.value?.toString());
      });
    }
    
    console.log("9. Final allowance:", ethers.utils.formatEther(await token3.allowance(deployer.address, deployer.address)));
    
    console.log("\n=== ANALYSIS ===");
    if (allowance1.gt(0) && allowance2.eq(0)) {
      console.log("🔍 FOUND IT: The issue is with the 10000 token amount!");
      console.log("Small amounts work, large amounts fail");
      console.log("This suggests the anti-whale protection is interfering");
    } else if (allowance1.eq(0) && allowance2.eq(0)) {
      console.log("🔍 Both amounts fail - there's a deeper issue");
    } else {
      console.log("🔍 Both amounts work - the issue is elsewhere");
    }
    
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

if (require.main === module) {
  debugInconsistency().catch(console.error);
}
