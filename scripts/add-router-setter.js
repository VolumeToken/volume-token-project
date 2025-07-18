// scripts/add-router-setter.js
const fs = require('fs');

function addRouterSetter() {
  console.log("🔧 Adding router setter function...\n");
  
  let contractContent = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
  
  // Add the setter function before the last closing brace
  const routerSetterFunction = `
    
    function setUniswapV2Router(address _router) external onlyOwner {
        uniswapV2Router = _router;
    }`;
  
  // Find the last function and add the setter before the final closing brace
  const lastFunctionIndex = contractContent.lastIndexOf('function');
  const nextClosingBrace = contractContent.indexOf('}', contractContent.lastIndexOf('}', lastFunctionIndex));
  
  // Insert before the final closing brace of the contract
  const insertPoint = contractContent.lastIndexOf('}');
  contractContent = contractContent.slice(0, insertPoint) + routerSetterFunction + '\n' + contractContent.slice(insertPoint);
  
  fs.writeFileSync('contracts/VOLUME_V2.sol', contractContent);
  console.log("✅ Router setter function added");
}

if (require.main === module) {
  addRouterSetter();
}
