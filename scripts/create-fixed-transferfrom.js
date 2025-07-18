// scripts/create-fixed-transferfrom.js
const fs = require('fs');

function createFixedTransferFrom() {
  console.log("🔧 Creating fixed transferFrom implementation...\n");
  
  // Read current contract
  let contractContent = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
  
  // Find and replace the transferFrom function
  const bulletproofTransferFrom = `
    // BULLETPROOF transferFrom implementation
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        address spender = _msgSender();
        
        // Handle allowance check and update manually
        uint256 currentAllowance = allowance(from, spender);
        if (currentAllowance != type(uint256).max) {
            require(currentAllowance >= amount, "ERC20: insufficient allowance");
            _approve(from, spender, currentAllowance - amount);
        }
        
        // Then do the transfer
        _transfer(from, to, amount);
        
        return true;
    }`;
  
  // Find the current transferFrom function and replace it
  const transferFromRegex = /function transferFrom\([^}]+\}/gs;
  
  if (contractContent.match(transferFromRegex)) {
    contractContent = contractContent.replace(transferFromRegex, bulletproofTransferFrom.trim());
    
    // Backup the original
    fs.writeFileSync('contracts/VOLUME_V2_backup.sol', fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8'));
    
    // Write the fixed version
    fs.writeFileSync('contracts/VOLUME_V2.sol', contractContent);
    
    console.log("✅ transferFrom function replaced with bulletproof implementation");
    console.log("✅ Original backed up to VOLUME_V2_backup.sol");
    
    console.log("\n📝 Changes made:");
    console.log("- Replaced _spendAllowance with manual allowance handling");
    console.log("- Added explicit allowance check and update");
    console.log("- Follows exact OpenZeppelin pattern");
    
    console.log("\n🚀 Next steps:");
    console.log("1. Compile the contract");
    console.log("2. Deploy the fixed version");
    console.log("3. Test the liquidity addition");
    
  } else {
    console.log("❌ Could not find transferFrom function to replace");
  }
}

if (require.main === module) {
  createFixedTransferFrom();
}
