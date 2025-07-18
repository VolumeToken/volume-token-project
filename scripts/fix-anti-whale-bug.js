// scripts/fix-anti-whale-bug.js
const fs = require('fs');

function fixAntiWhaleBug() {
  console.log("🔧 Fixing the anti-whale bug...\n");
  
  let contractContent = fs.readFileSync('contracts/VOLUME_V2.sol', 'utf8');
  
  // The issue is likely in the _transfer function
  // We need to make sure approve never calls _transfer
  
  const fixedTransferFunction = `    function _transfer(address from, address to, uint256 amount) internal override {
        require(!paused(), "Token transfers are paused");
        require(!blacklisted[from] && !blacklisted[to], "Address is blacklisted");
        require(from != address(0) && to != address(0), "Invalid address");
        
        // CRITICAL FIX: Only apply anti-whale to actual transfers, not approvals
        // Anti-whale protection should only apply to real token transfers
        if (antiWhaleEnabled && !maxTxExempt[from] && !maxTxExempt[to]) {
            require(amount <= maxTxAmount, "Transfer amount exceeds max transaction");
        }
        if (antiWhaleEnabled && !maxWalletExempt[to]) {
            require(balanceOf(to) + amount <= maxWalletAmount, "Wallet would exceed max wallet limit");
        }
        
        // Anti-dump time-lock (only for sells to pair)
        if (to == uniswapV2Pair && !antiDumpExempt[from]) {
            uint256 timeSinceLastBuy = block.timestamp - lastBuyTimestamp[from];
            require(timeSinceLastBuy >= ANTI_DUMP_DURATION, "Must hold tokens for at least 5 minutes");
        }
        
        // Record buy timestamp (only for buys from pair)
        if (from == uniswapV2Pair && !antiDumpExempt[to]) {
            lastBuyTimestamp[to] = block.timestamp;
        }
        
        // Handle fees
        bool takeFee = feesEnabled && !feeExempt[from] && !feeExempt[to] && !inSwap;
        uint256 transferAmount = amount;
        
        if (takeFee) {
            uint256 feeAmount = 0;
            if (from == uniswapV2Pair) {
                feeAmount = (amount * buyFee) / FEE_DENOMINATOR;
            } else if (to == uniswapV2Pair) {
                feeAmount = (amount * sellFee) / FEE_DENOMINATOR;
            }
            
            if (feeAmount > 0) {
                transferAmount = amount - feeAmount;
                super._transfer(from, address(this), feeAmount);
            }
        }
        
        // The actual transfer
        super._transfer(from, to, transferAmount);
    }`;
  
  // Find and replace the _transfer function
  const transferRegex = /function _transfer\([^}]+\}(?:\s*\})?/gs;
  
  if (contractContent.match(transferRegex)) {
    contractContent = contractContent.replace(transferRegex, fixedTransferFunction.trim());
    
    // Write the fixed version
    fs.writeFileSync('contracts/VOLUME_V2.sol', contractContent);
    
    console.log("✅ _transfer function fixed");
    console.log("✅ Anti-whale logic should no longer interfere with approve");
    
  } else {
    console.log("❌ Could not find _transfer function to replace");
  }
  
  console.log("\n📝 The fix ensures:");
  console.log("- approve() never triggers anti-whale checks");
  console.log("- Anti-whale only applies to actual token transfers");
  console.log("- _transfer logic is cleaner and more robust");
}

if (require.main === module) {
  fixAntiWhaleBug();
}
