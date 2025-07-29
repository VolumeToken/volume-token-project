const { ethers } = require("hardhat");

const CONFIRM_MAINNET = false; // CHANGE TO true WHEN READY

async function main() {
    if (!CONFIRM_MAINNET) {
        console.log("❌ Set CONFIRM_MAINNET = true to deploy");
        return;
    }
    
    console.log("\n🚀 Deploying VOLUME to MAINNET...\n");
    
    const [deployer] = await ethers.getSigners();
    const Volume = await ethers.getContractFactory("VOLUME");
    const volume = await Volume.deploy("1000000000");
    await volume.deployed();
    
    console.log("✅ DEPLOYED TO MAINNET!");
    console.log("Contract:", volume.address);
    console.log("Etherscan: https://etherscan.io/address/" + volume.address);
}

main().catch(console.error);
