// scripts/check-contract-functions.js
const { ethers } = require("hardhat");

async function checkContractFunctions() {
  console.log("🔍 Checking available contract functions...\n");
  
  try {
    const TOKEN_ADDRESS = "0x5D3a740cb69Df9e36389C9DD2e2015F8408A3f52";
    const VOLUME_V2 = await ethers.getContractFactory("VOLUME_V2");
    const token = VOLUME_V2.attach(TOKEN_ADDRESS);
    
    console.log("=== Available Functions ===");
    
    const functions = [
      "setBlacklisted",
      "setBlackListed", 
      "blacklisted",
      "blackListed",
      "isBlacklisted",
      "addToBlacklist",
      "removeFromBlacklist"
    ];
    
    for (const funcName of functions) {
      try {
        if (token[funcName]) {
          console.log(`✅ ${funcName} exists`);
          
          // If it's a view function, test it
          if (funcName.includes("blacklisted") || funcName.includes("isBlacklisted")) {
            try {
              const result = await token[funcName]("0x1234567890123456789012345678901234567890");
              console.log(`   Result for test address: ${result}`);
            } catch (e) {
              console.log(`   Function exists but may need parameters`);
            }
          }
        }
      } catch (error) {
        console.log(`❌ ${funcName} does not exist`);
      }
    }
    
    // Check if contract has blacklist mapping directly
    console.log("\n=== Testing Blacklist Functionality ===");
    
    try {
      const testAddress = "0x1234567890123456789012345678901234567890";
      const isBlacklisted = await token.blacklisted(testAddress);
      console.log("✅ blacklisted mapping exists, test address status:", isBlacklisted);
    } catch (error) {
      console.log("❌ No blacklisted mapping found");
    }
    
  } catch (error) {
    console.error("❌ Function check failed:", error.message);
  }
}

if (require.main === module) {
  checkContractFunctions().catch(console.error);
}
