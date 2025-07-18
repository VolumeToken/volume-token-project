// scripts/test-ethers-vs-raw.js
const { ethers } = require("hardhat");

async function testEthersVsRaw() {
  console.log("🔍 Testing ethers.js vs raw call difference...\n");
  
  try {
    const [deployer] = await ethers.getSigners();
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    
    console.log("Contract deployed:", token.address);
    
    const testAmount = ethers.utils.parseEther("1000");
    
    console.log("\n=== Test 1: Raw Transaction (We Know This Works) ===");
    
    const approveData = token.interface.encodeFunctionData("approve", [deployer.address, testAmount]);
    
    const rawTx = await deployer.sendTransaction({
      to: token.address,
      data: approveData,
      gasLimit: 100000
    });
    await rawTx.wait();
    
    const allowanceRaw = await token.allowance(deployer.address, deployer.address);
    console.log("Raw call allowance:", ethers.utils.formatEther(allowanceRaw));
    
    // Reset allowance
    const resetData = token.interface.encodeFunctionData("approve", [deployer.address, 0]);
    await deployer.sendTransaction({
      to: token.address,
      data: resetData,
      gasLimit: 100000
    });
    
    console.log("\n=== Test 2: Ethers.js Contract Call (Broken) ===");
    
    const ethersApproveTx = await token.approve(deployer.address, testAmount);
    await ethersApproveTx.wait();
    
    const allowanceEthers = await token.allowance(deployer.address, deployer.address);
    console.log("Ethers.js call allowance:", ethers.utils.formatEther(allowanceEthers));
    
    console.log("\n=== Test 3: Compare Transaction Data ===");
    
    console.log("Raw tx data:", approveData);
    console.log("Ethers tx data:", ethersApproveTx.data);
    console.log("Data matches:", approveData === ethersApproveTx.data);
    
    console.log("\n=== Test 4: Use Different Ethers Methods ===");
    
    // Reset
    await token.approve(deployer.address, 0);
    
    // Try with explicit gas
    console.log("Testing with explicit gas limit...");
    await token.approve(deployer.address, testAmount, { gasLimit: 100000 });
    const allowanceGas = await token.allowance(deployer.address, deployer.address);
    console.log("With gas limit allowance:", ethers.utils.formatEther(allowanceGas));
    
    // Reset
    await token.approve(deployer.address, 0);
    
    // Try with populateTransaction
    console.log("Testing with populateTransaction...");
    const populatedTx = await token.populateTransaction.approve(deployer.address, testAmount);
    const populatedResponse = await deployer.sendTransaction({
      ...populatedTx,
      gasLimit: 100000
    });
    await populatedResponse.wait();
    
    const allowancePopulated = await token.allowance(deployer.address, deployer.address);
    console.log("Populated tx allowance:", ethers.utils.formatEther(allowancePopulated));
    
    console.log("\n=== ANALYSIS ===");
    
    if (allowanceRaw.gt(0) && allowanceEthers.eq(0)) {
      console.log("🎯 FOUND THE BUG: Ethers.js contract calls are broken somehow");
      console.log("✅ Raw transactions work perfectly");
      console.log("❌ contract.approve() doesn't work");
      
      if (allowanceGas.gt(0)) {
        console.log("🔧 SOLUTION: Use explicit gas limits");
      } else if (allowancePopulated.gt(0)) {
        console.log("🔧 SOLUTION: Use populateTransaction method");
      } else {
        console.log("🔧 SOLUTION: Use raw transactions");
      }
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

if (require.main === module) {
  testEthersVsRaw().catch(console.error);
}
