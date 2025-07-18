// scripts/check-what-changed.js
const fs = require('fs');

function checkWhatChanged() {
  console.log("🔍 Checking what changed in the contract...\n");
  
  // Check current contract
  const contractSource = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
  
  console.log("Contract file size:", contractSource.length);
  
  // Check if approve function exists
  if (contractSource.includes('function approve(')) {
    console.log("⚠️  Contract has custom approve function - this might be the issue!");
    
    // Find approve function
    const lines = contractSource.split('\n');
    let inApprove = false;
    let braceCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('function approve(')) {
        inApprove = true;
        braceCount = 0;
        console.log("Found custom approve function at line", i + 1);
      }
      
      if (inApprove) {
        console.log(`${i + 1}: ${line}`);
        braceCount += (line.match(/{/g) || []).length;
        braceCount -= (line.match(/}/g) || []).length;
        
        if (braceCount === 0 && line.includes('}')) {
          break;
        }
      }
    }
  } else {
    console.log("✅ Contract uses inherited approve function");
  }
  
  // Check transferFrom function
  if (contractSource.includes('function transferFrom(')) {
    console.log("✅ Contract has custom transferFrom function");
  } else {
    console.log("❌ Contract missing transferFrom function!");
  }
  
  // Check for any syntax errors
  const openBraces = (contractSource.match(/{/g) || []).length;
  const closeBraces = (contractSource.match(/}/g) || []).length;
  console.log("Brace balance:", openBraces, "open,", closeBraces, "close");
  
  if (openBraces !== closeBraces) {
    console.log("❌ SYNTAX ERROR: Mismatched braces!");
  }
}

if (require.main === module) {
  checkWhatChanged();
}
