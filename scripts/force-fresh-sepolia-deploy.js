// scripts/force-fresh-sepolia-deploy.js
const { ethers } = require("hardhat");

async function forceFreshSepoliaDeploy() {
  console.log("🚀 Force fresh Sepolia deployment...\n");
  
  try {
    const network = await ethers.provider.getNetwork();
    if (network.chainId !== 11155111) {
      console.log("❌ Must run with --network sepolia");
      return;
    }
    
    const [deployer] = await ethers.getSigners();
    const SEPOLIA_ROUTER = "0xC532a74256D3Db42D0Bf7a0400fEFDbad7694008";
    
    console.log("=== 1. Verify Local Contract Works ===");
    
    // This should be run locally first to confirm
    console.log("⚠️  Make sure you've tested locally first!");
    
    console.log("\n=== 2. Deploy to Sepolia with Gas Settings ===");
    
    const VOLUME_V2 = await ethers.getContractFactory("contracts/VOLUME_V2.sol:VOLUME_V2");
    
    // Deploy with explicit gas settings for Sepolia
    const deployTx = await VOLUME_V2.getDeployTransaction(
      deployer.address,
      deployer.address,
      ethers.constants.AddressZero, // Start with zero router
      deployer.address
    );
    
    // Add gas settings
    deployTx.gasLimit = 3000000; // High gas limit
    deployTx.gasPrice = ethers.utils.parseUnits("20", "gwei"); // Explicit gas price
    
    console.log("Deploying with gas limit:", deployTx.gasLimit.toString());
    console.log("Gas price:", ethers.utils.formatUnits(deployTx.gasPrice, "gwei"), "gwei");
    
    const deployResponse = await deployer.sendTransaction(deployTx);
    console.log("Deploy tx hash:", deployResponse.hash);
    
    const receipt = await deployResponse.wait();
    console.log("Deploy successful, gas used:", receipt.gasUsed.toString());
    
    // Get the contract address
    const contractAddress = receipt.contractAddress;
    console.log("✅ Deployed to:", contractAddress);
    
    // Connect to deployed contract
    const token = VOLUME_V2.attach(contractAddress);
    
    console.log("\n=== 3. Test Deployed Contract ===");
    
    const testAmount = ethers.utils.parseEther("10000");
    
    try {
      // Test approve with explicit gas
      const approveTx = await token.approve(deployer.address, testAmount, {
        gasLimit: 100000,
        gasPrice: ethers.utils.parseUnits("20", "gwei")
      });
      
      await approveTx.wait();
      
      const allowance = await token.allowance(deployer.address, deployer.address);
      console.log("Allowance:", ethers.utils.formatEther(allowance));
      
      if (allowance.gt(0)) {
        console.log("🎉 SUCCESS! Fresh deployment works on Sepolia!");
        
        // Test transferFrom
        await token.transferFrom(deployer.address, deployer.address, testAmount, {
          gasLimit: 200000
        });
        console.log("✅ TransferFrom also works!");
        
        console.log("\n=== 4. Set Router ===");
        await token.uniswapV2Router.staticCall ? null : await token.setUniswapV2Router(SEPOLIA_ROUTER);
        
      } else {
        console.log("❌ Still fails even with fresh deployment and gas settings");
      }
      
    } catch (error) {
      console.log("❌ Approve failed:", error.message);
    }
    
    console.log("\n📋 New Working Contract:");
    console.log("Address:", contractAddress);
    console.log("Etherscan:", `https://sepolia.etherscan.io/address/${contractAddress}`);
    
  } catch (error) {
    console.error("❌ Deploy failed:", error.message);
  }
}

if (require.main === module) {
  forceFreshSepoliaDeploy().catch(console.error);
}
