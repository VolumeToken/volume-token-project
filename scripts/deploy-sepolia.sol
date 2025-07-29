const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    console.log("\n🚀 Deploying VOLUME to Sepolia...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    
    const Volume = await ethers.getContractFactory("VOLUME");
    const volume = await Volume.deploy("1000000000");
    await volume.deployed();
    
    console.log("✅ Deployed to:", volume.address);
    console.log("View on Etherscan: https://sepolia.etherscan.io/address/" + volume.address);
    
    const deployment = {
        network: "sepolia",
        address: volume.address,
        timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync("deployment-sepolia.json", JSON.stringify(deployment, null, 2));
}

main().catch(console.error);
