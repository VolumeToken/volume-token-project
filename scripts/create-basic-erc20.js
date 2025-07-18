// scripts/create-basic-erc20.js
const fs = require('fs');

// Create the most basic ERC20 with transferFrom override
const basicContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract TestBasicERC20 is ERC20 {
    constructor() ERC20("Test", "TEST") {
        _mint(msg.sender, 1000000 * 10**18);
    }
    
    function transferFrom(address from, address to, uint256 amount) public override returns (bool) {
        address spender = _msgSender();
        _spendAllowance(from, spender, amount);
        _transfer(from, to, amount);
        return true;
    }
}
`;

fs.writeFileSync('contracts/TestBasicERC20.sol', basicContract);
console.log('✅ TestBasicERC20.sol created');

// Also show what should be in VOLUME_V2
const volumeV2Fix = `
// Add this transferFrom function to your VOLUME_V2.sol:

function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
    address spender = _msgSender();
    _spendAllowance(from, spender, amount);
    _transfer(from, to, amount);
    return true;
}
`;

console.log('\n📝 Add this to your VOLUME_V2.sol:');
console.log(volumeV2Fix);
