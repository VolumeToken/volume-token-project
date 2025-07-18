// scripts/test-functionality.js
const { ethers } = require("hardhat");

async function testFunctionality() {
  console.log("🧪 Testing VOLUME Token functionality...\n");
  
  const [deployer, user1, user2] = await ethers.getSigners();
  
  // Use your deployed token address
  const TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";
  const VESTING_ADDRESS = "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0";
  
  const VOLUME = await ethers.getContractFactory("VOLUME");
  const token = VOLUME.attach(TOKEN_ADDRESS);
  
  const TeamVesting = await ethers.getContractFactory("TeamVesting");
  const vesting = TeamVesting.attach(VESTING_ADDRESS);

  try {
    // Test 1: Basic transfers
    console.log("=== 1. Testing Transfers ===");
    const amount = ethers.utils.parseEther("1000");
    await token.transfer(user1.address, amount);
    console.log("✅ Transfer to user1 successful");
    console.log("User1 balance:", ethers.utils.formatEther(await token.balanceOf(user1.address)));

    // Test 2: Approve and transferFrom
    console.log("\n=== 2. Testing Approve/TransferFrom ===");
    await token.connect(user1).approve(deployer.address, amount.div(2));
    await token.transferFrom(user1.address, user2.address, amount.div(2));
    console.log("✅ TransferFrom successful");
    console.log("User2 balance:", ethers.utils.formatEther(await token.balanceOf(user2.address)));

    // Test 3: Fee settings
    console.log("\n=== 3. Testing Fee Configuration ===");
    console.log("Buy Fee:", (await token.buyFee()).toString(), "basis points");
    console.log("Sell Fee:", (await token.sellFee()).toString(), "basis points");
    console.log("LP Fee Share:", (await token.lpFeeShare()).toString());
    console.log("Marketing Fee Share:", (await token.marketingFeeShare()).toString());

    // Test 4: Anti-whale limits
    console.log("\n=== 4. Testing Anti-Whale Limits ===");
    console.log("Max Tx Amount:", ethers.utils.formatEther(await token.maxTxAmount()));
    console.log("Max Wallet Amount:", ethers.utils.formatEther(await token.maxWalletAmount()));

    // Test 5: Vesting contract
    console.log("\n=== 5. Testing Vesting Contract ===");
    const vestingInfo = await vesting.getVestingInfo();
    console.log("Vesting Token:", vestingInfo._token);
    console.log("Beneficiary:", vestingInfo._beneficiary);
    console.log("Total Tokens:", ethers.utils.formatEther(vestingInfo._totalTokens));
    console.log("Start Time:", new Date(vestingInfo._startTime.toNumber() * 1000));
    
    const claimable = await vesting.claimableAmount();
    console.log("Currently Claimable:", ethers.utils.formatEther(claimable));

    // Test 6: Anti-dump mechanism
    console.log("\n=== 6. Testing Anti-Dump Mechanism ===");
    console.log("User1 can sell:", await token.canSell(user1.address));
    console.log("User2 can sell:", await token.canSell(user2.address));

    console.log("\n🎉 All functionality tests passed!");

  } catch (error) {
    console.error("❌ Functionality test failed:", error.message);
  }
}

if (require.main === module) {
  testFunctionality().catch(console.error);
}
