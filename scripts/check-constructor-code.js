// scripts/check-constructor-code.js
const fs = require('fs');

function checkConstructorCode() {
  console.log("🔍 Checking constructor code...\n");
  
  const contractSource = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
  const lines = contractSource.split('\n');
  
  // Find the constructor
  let inConstructor = false;
  let braceCount = 0;
  let constructorLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('constructor(')) {
      inConstructor = true;
      braceCount = 0;
    }
    
    if (inConstructor) {
      constructorLines.push(`${i + 1}: ${line}`);
      braceCount += (line.match(/{/g) || []).length;
      braceCount -= (line.match(/}/g) || []).length;
      
      if (braceCount === 0 && line.includes('}')) {
        break;
      }
    }
  }
  
  console.log("Current constructor code:");
  console.log("========================");
  constructorLines.forEach(line => console.log(line));
  
  console.log("\n=== ANALYSIS ===");
  
  const constructorText = constructorLines.join('\n');
  
  if (constructorText.includes('createPair')) {
    console.log("🔍 Constructor creates Uniswap pair - this might be the issue!");
  }
  
  if (constructorText.includes('factory')) {
    console.log("🔍 Constructor interacts with Uniswap factory");
  }
  
  if (constructorText.includes('_transfer')) {
    console.log("🔍 Constructor calls _transfer - this could trigger anti-whale logic!");
  }
  
  if (constructorText.includes('approve')) {
    console.log("🔍 Constructor calls approve functions");
  }
  
  console.log("\n=== RECOMMENDATION ===");
  console.log("The constructor should ONLY set basic variables");
  console.log("Complex logic (like pair creation) should happen after deployment");
}

if (require.main === module) {
  checkConstructorCode();
}
