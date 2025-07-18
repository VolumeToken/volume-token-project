// scripts/find-anti-whale-interference.js
const fs = require('fs');

function findAntiWhaleInterference() {
  console.log("🔍 Finding where anti-whale interferes with approve...\n");
  
  const contractSource = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
  const lines = contractSource.split('\n');
  
  console.log("=== Analyzing _transfer function ===");
  
  // Find the _transfer function
  let inTransfer = false;
  let braceCount = 0;
  let transferLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('function _transfer(')) {
      inTransfer = true;
      braceCount = 0;
    }
    
    if (inTransfer) {
      transferLines.push(`${i + 1}: ${line}`);
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      if (braceCount === 0 && line.includes('}')) {
        break;
      }
    }
  }
  
  console.log("Current _transfer function:");
  transferLines.forEach(line => console.log(line));
  
  console.log("\n=== DIAGNOSIS ===");
  console.log("The approve function should NEVER call _transfer");
  console.log("But our custom _transfer has anti-whale logic");
  console.log("Somehow approve is triggering _transfer, which triggers anti-whale checks");
  
  console.log("\n=== THE BUG ===");
  console.log("The issue is that approve() is somehow calling _transfer()");
  console.log("This should NEVER happen in standard ERC20");
  console.log("There must be a bug in our contract logic");
}

if (require.main === module) {
  findAntiWhaleInterference();
}
