// scripts/get-constructor-params.js
const { ethers } = require("hardhat");

async function getConstructorParams() {
  console.log("🔍 Getting actual constructor parameters...\n");
  
  const TOKEN_ADDRESS = "0x95704fD69a2Ad32a2A4127C82A9147c8355415da";
  const VESTING_ADDRESS = "0xDBb24DA2Fda94C60f59080ecebA1138dD925FC45";
  
  try {
    const VOLUME = await ethers.getContractFactory("VOLUME");
    const token = VOLUME.attach(TOKEN_ADDRESS);
    
    const TeamVesting = await ethers.getContractFactory("TeamVesting");
    const vesting = TeamVesting.attach(VESTING_ADDRESS);
    
    console.log("=== VOLUME Token Constructor Parameters ===");
    console.log("marketingMultisig:", await token.marketingMultisig());
    console.log("retailerRewardAddress:", await token.retailerRewardAddress());
    console.log("uniswapV2Router:", await token.uniswapV2Router());
    console.log("timeLockController:", await token.timeLockController());
    
    console.log("\n=== TeamVesting Constructor Parameters ===");
    const vestingInfo = await vesting.getVestingInfo();
    
    console.log("token:", vestingInfo._token);
    console.log("beneficiary:", vestingInfo._beneficiary);
    console.log("totalTokens:", vestingInfo._totalTokens.toString());
    console.log("startTime:", vestingInfo._startTime.toString());
    console.log("vestingDuration:", vestingInfo._vestingDuration.toString());
    
    // Convert timestamp to readable date
    const startTimeDate = new Date(vestingInfo._startTime.toNumber() * 1000);
    console.log("startTime (readable):", startTimeDate.toISOString());
    
    console.log("\n=== Verification Commands ===");
    
    console.log("\n1. VOLUME Token:");
    console.log(`npx hardhat verify --network sepolia ${TOKEN_ADDRESS} \\`);
    console.log(`  "${await token.marketingMultisig()}" \\`);
    console.log(`  "${await token.retailerRewardAddress()}" \\`);
    console.log(`  "${await token.uniswapV2Router()}" \\`);
    console.log(`  "${await token.timeLockController()}"`);
    
    console.log("\n2. TeamVesting:");
    console.log(`npx hardhat verify --network sepolia ${VESTING_ADDRESS} \\`);
    console.log(`  "${vestingInfo._token}" \\`);
    console.log(`  "${vestingInfo._beneficiary}" \\`);
    console.log(`  "${vestingInfo._totalTokens.toString()}" \\`);
    console.log(`  "${vestingInfo._startTime.toString()}"`);
    
  } catch (error) {
    console.error("❌ Failed to get parameters:", error.message);
  }
}

if (require.main === module) {
  getConstructorParams().catch(console.error);
}
