// scripts/test-anti-whale-theory.js
const { ethers } = require("hardhat");

async function testAntiWhaleTheory() {
  console.log("🧪 Testing anti-whale interference theory...\n");
  
  try {
    const [deployer] = await ethers.getSigners();
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    
    console.log("=== Check Anti-Whale Settings ===");
    
    const maxTx = await token.maxTxAmount();
    const maxWallet = await token.maxWalletAmount();
    const antiWhaleEnabled = await token.antiWhaleEnabled();
    
    console.log("Anti-whale enabled:", antiWhaleEnabled);
    console.log("Max TX amount:", ethers.utils.formatEther(maxTx));
    console.log("Max wallet amount:", ethers.utils.formatEther(maxWallet));
    
    console.log("\n=== Test Different Amounts ===");
    
    const amounts = [
      ethers.utils.parseEther("100"),
      ethers.utils.parseEther("1000"),
      ethers.utils.parseEther("10000"),
      ethers.utils.parseEther("100000"),
      maxTx.div(2), // Half of max TX
      maxTx,        // Exactly max TX
      maxTx.add(1)  // Just over max TX
    ];
    
    for (let i = 0; i < amounts.length; i++) {
      const amount = amounts[i];
      console.log(`\nTesting amount ${i + 1}: ${ethers.utils.formatEther(amount)}`);
      
      try {
        // Reset allowance first
        await token.approve(deployer.address, 0);
        
        // Try the new amount
        await token.approve(deployer.address, amount);
        const allowance = await token.allowance(deployer.address, deployer.address);
        
        console.log(`✅ Success! Allowance: ${ethers.utils.formatEther(allowance)}`);
        
        if (allowance.eq(0)) {
          console.log("❌ But allowance is 0 - approve didn't work");
        }
        
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
      }
    }
    
    console.log("\n=== Test with Anti-Whale Disabled ===");
    
    console.log("Disabling anti-whale...");
    await token.setAntiWhaleEnabled(false);
    
    const largeAmount = ethers.utils.parseEther("10000");
    await token.approve(deployer.address, largeAmount);
    const allowanceWithoutAntiWhale = await token.allowance(deployer.address, deployer.address);
    
    console.log("Allowance without anti-whale:", ethers.utils.formatEther(allowanceWithoutAntiWhale));
    
    if (allowanceWithoutAntiWhale.gt(0)) {
      console.log("🎉 FOUND THE ISSUE: Anti-whale protection is interfering with approve!");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testAntiWhaleTheory().catch(console.error);
}
