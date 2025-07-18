// scripts/verify-timelock.js
const { run } = require("hardhat");

async function verifyTimelock() {
  console.log("🔍 Verifying TimelockController...");
  
  const contractAddress = "0x6A8b74C4A0C290788f94708987b99Fd709d8dfaC";
  const deployer = "0x935B3aC12B0CE29dd28cbCefCee8121354233e49";
  
  try {
    await run("verify:verify", {
      address: contractAddress,
      contract: "@openzeppelin/contracts/governance/TimelockController.sol:TimelockController",
      constructorArguments: [
        86400, // minDelay (1 day)
        [deployer], // proposers array
        [deployer], // executors array
        "0x0000000000000000000000000000000000000000" // admin
      ]
    });
    
    console.log("✅ TimelockController verified successfully!");
    
  } catch (error) {
    console.error("❌ Verification failed:", error.message);
  }
}

if (require.main === module) {
  verifyTimelock().catch(console.error);
}
