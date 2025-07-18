// scripts/emergency-diagnostic.js
const { ethers } = require("hardhat");

async function emergencyDiagnostic() {
  console.log("🚨 Emergency diagnostic - something broke!\n");
  
  try {
    const network = await ethers.provider.getNetwork();
    console.log("Network:", network.name, "Chain ID:", network.chainId);
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("ETH balance:", ethers.utils.formatEther(await deployer.getBalance()));
    
    console.log("\n=== Test 1: Ultra Simple ERC20 ===");
    
    // Test if even basic ERC20 works
    try {
      const UltraSimple = await ethers.getContractFactory("UltraSimple");
      const simple = await UltraSimple.deploy();
      await simple.deployed();
      
      const amount = ethers.utils.parseEther("1000");
      await simple.approve(deployer.address, amount);
      const simpleAllowance = await simple.allowance(deployer.address, deployer.address);
      
      console.log("Ultra-simple allowance:", ethers.utils.formatEther(simpleAllowance));
      
      if (simpleAllowance.eq(0)) {
        console.log("❌ CRITICAL: Even ultra-simple ERC20 fails!");
        console.log("This suggests a fundamental network or RPC issue");
        return;
      } else {
        console.log("✅ Ultra-simple works - issue is with VOLUME_V2");
      }
      
    } catch (error) {
      console.log("Ultra-simple failed:", error.message);
    }
    
    console.log("\n=== Test 2: Check Current VOLUME_V2 Bytecode ===");
    
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    console.log("Current bytecode length:", VOLUME_V2.bytecode.length);
    
    // Check if transferFrom is in bytecode
    const hasTransferFrom = VOLUME_V2.bytecode.includes("23b872dd");
    console.log("Has transferFrom in bytecode:", hasTransferFrom);
    
    console.log("\n=== Test 3: Try Approve with Different Gas Settings ===");
    
    const token = await VOLUME_V2.deploy(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero,
      deployer.address
    );
    await token.deployed();
    
    console.log("Contract deployed:", token.address);
    
    const testAmount = ethers.utils.parseEther("1000"); // Start smaller
    
    try {
      // Try with very high gas limit
      console.log("Trying approve with high gas limit...");
      const approveTx = await token.approve(deployer.address, testAmount, {
        gasLimit: 500000
      });
      
      const receipt = await approveTx.wait();
      console.log("Approve tx successful, gas used:", receipt.gasUsed.toString());
      
      const allowance = await token.allowance(deployer.address, deployer.address);
      console.log("Allowance result:", ethers.utils.formatEther(allowance));
      
      if (allowance.eq(0)) {
        console.log("❌ Approve transaction succeeded but allowance is still 0!");
        console.log("This means the approve function is broken in the contract");
      }
      
    } catch (error) {
      console.log("❌ Approve transaction failed:", error.message);
    }
    
    console.log("\n=== Test 4: Check Contract Events ===");
    
    // Check if Approval events are being emitted
    const filter = token.filters.Approval();
    const events = await token.queryFilter(filter);
    console.log("Approval events found:", events.length);
    
    if (events.length > 0) {
      console.log("Latest Approval event:", events[events.length - 1].args);
    } else {
      console.log("❌ No Approval events found - approve function not working");
    }
    
    console.log("\n=== Test 5: Check if Contract is Using Old Bytecode ===");
    
    // Check deployed bytecode
    const deployedBytecode = await ethers.provider.getCode(token.address);
    console.log("Deployed bytecode length:", deployedBytecode.length);
    console.log("Local vs deployed match:", VOLUME_V2.bytecode.length === deployedBytecode.length);
    
    if (VOLUME_V2.bytecode.length !== deployedBytecode.length) {
      console.log("🚨 CRITICAL: Deployed contract has different bytecode!");
      console.log("The deployment is not using your current contract code");
    }
    
  } catch (error) {
    console.error("❌ Emergency diagnostic failed:", error.message);
  }
}

if (require.main === module) {
  emergencyDiagnostic().catch(console.error);
}
