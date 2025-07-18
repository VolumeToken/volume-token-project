// scripts/create-fixed-transferfrom-clean.js
const fs = require('fs');

function createFixedTransferFromClean() {
  console.log("🔧 Creating fixed transferFrom implementation (clean)...\n");
  
  // Read current contract
  let contractContent = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
  
  // The bulletproof transferFrom function
  const bulletproofTransferFrom = `    // BULLETPROOF transferFrom implementation
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
  // Look for the function definition and replace the entire function
  const lines = contractContent.split('\n');
  let newLines = [];
  let inTransferFrom = false;
  let braceCount = 0;
  let functionReplaced = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('function transferFrom') && !functionReplaced) {
      // Found the transferFrom function, start replacing
      inTransferFrom = true;
      braceCount = 0;
      
      // Add the new function instead
      newLines.push(bulletproofTransferFrom);
      functionReplaced = true;
      
      // Count braces in this line
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      // Skip this line since we're replacing it
      continue;
    }
    
    if (inTransferFrom) {
      // Skip lines until we close the function
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      if (braceCount <= 0) {
        inTransferFrom = false;
      }
      // Skip this line
      continue;
    }
    
    // Keep all other lines
    newLines.push(line);
  }
  
  if (functionReplaced) {
    // Write the fixed version
    fs.writeFileSync('contracts/VOLUME_V2.sol', newLines.join('\n'));
    
    console.log("✅ transferFrom function replaced with bulletproof implementation");
    console.log("✅ No backup created to avoid name conflicts");
    
    console.log("\n📝 Changes made:");
    console.log("- Replaced _spendAllowance with manual allowance handling");
    console.log("- Added explicit allowance check and update");
    console.log("- Follows exact OpenZeppelin pattern");
    
  } else {
    console.log("❌ Could not find transferFrom function to replace");
  }
}

if (require.main === module) {
  createFixedTransferFromClean();
}
