// scripts/create-safe-constructor.js
const fs = require('fs');

function createSafeConstructor() {
  console.log("🔧 Creating safe constructor (no complex logic)...\n");
  
  let contractContent = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
  
  // Find and replace the constructor with a safe version
  const safeConstructor = `    constructor(
        address _marketingMultisig,
        address _retailerRewardAddress,
        address _uniswapV2Router,
        address _timeLockController
    ) ERC20("VOLUME", "VLM") {
        // SAFE CONSTRUCTOR - Only set basic variables, no complex logic
        marketingMultisig = _marketingMultisig;
        retailerRewardAddress = _retailerRewardAddress;
        uniswapV2Router = _uniswapV2Router;
        timeLockController = _timeLockController;
        
        // Set exemptions for deployer
        feeExempt[msg.sender] = true;
        maxTxExempt[msg.sender] = true;
        maxWalletExempt[msg.sender] = true;
        antiDumpExempt[msg.sender] = true;
        
        // Mint tokens to deployer
        _mint(msg.sender, TOTAL_SUPPLY);
        
        // NOTE: Pair creation should happen AFTER deployment
        // NOTE: Router exemptions should be set AFTER deployment
    }`;
  
  // Replace constructor
  const constructorRegex = /constructor\([^}]+\}/gs;
  
  if (contractContent.match(constructorRegex)) {
    contractContent = contractContent.replace(constructorRegex, safeConstructor.trim());
    
    // Add router setter function if it doesn't exist
    if (!contractContent.includes('function setUniswapV2Router')) {
      const routerSetter = `
    
    function setUniswapV2Router(address _router) external onlyOwner {
        uniswapV2Router = _router;
    }`;
      
      const insertPoint = contractContent.lastIndexOf('}');
      contractContent = contractContent.slice(0, insertPoint) + routerSetter + '\n' + contractContent.slice(insertPoint);
    }
    
    fs.writeFileSync('contracts/VOLUME_V2.sol', contractContent);
    console.log("✅ Safe constructor created");
    console.log("✅ Router setter function added");
    
    console.log("\n📝 Changes made:");
    console.log("- Constructor only sets basic variables");
    console.log("- No pair creation in constructor");
    console.log("- No complex logic in constructor");
    console.log("- Router can be set after deployment");
    
  } else {
    console.log("❌ Could not find constructor to replace");
  }
}

if (require.main === module) {
  createSafeConstructor();
}
