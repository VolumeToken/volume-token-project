
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract VOLUME_V2 is ERC20, Ownable, Pausable {
    uint256 public constant TOTAL_SUPPLY = 50_000_000_000 * 10**18;
    uint256 public constant FEE_DENOMINATOR = 10000;
    uint256 public constant ANTI_DUMP_DURATION = 5 minutes;
    
    uint256 public buyFee = 200;
    uint256 public sellFee = 400;
    uint256 public maxTxAmount = (TOTAL_SUPPLY * 5) / 1000;
    uint256 public maxWalletAmount = (TOTAL_SUPPLY * 10) / 1000;
    
    address public marketingMultisig;
    address public retailerRewardAddress;
    address public uniswapV2Router;
    address public uniswapV2Pair;
    address public timeLockController;
    
    mapping(address => bool) public blacklisted;
    mapping(address => bool) public feeExempt;
    mapping(address => bool) public maxTxExempt;
    mapping(address => bool) public maxWalletExempt;
    mapping(address => bool) public antiDumpExempt;
    mapping(address => uint256) public lastBuyTimestamp;
    
    bool public feesEnabled = true;
    bool public antiWhaleEnabled = true;
    bool private inSwap;
    
    constructor(
        address _marketingMultisig,
        address _retailerRewardAddress,
        address _uniswapV2Router,
        address _timeLockController
    ) ERC20("VOLUME", "VLM") {
        marketingMultisig = _marketingMultisig;
        retailerRewardAddress = _retailerRewardAddress;
        uniswapV2Router = _uniswapV2Router;
        timeLockController = _timeLockController;
        
        feeExempt[msg.sender] = true;
        maxTxExempt[msg.sender] = true;
        maxWalletExempt[msg.sender] = true;
        antiDumpExempt[msg.sender] = true;
        
        _mint(msg.sender, TOTAL_SUPPLY);
    }
    
    // FIXED transferFrom function
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
    }
    
    // FIXED _transfer function - ONLY applies anti-whale to actual transfers
    function _transfer(address from, address to, uint256 amount) internal override {
        require(from != address(0), "ERC20: transfer from the zero address");
        require(to != address(0), "ERC20: transfer to the zero address");
        require(!paused(), "Token transfers are paused");
        require(!blacklisted[from] && !blacklisted[to], "Address is blacklisted");
        
        // Anti-whale protection - ONLY for actual token transfers
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
    }
    
    // Admin functions
    function setFeeExempt(address account, bool exempt) external onlyOwner {
        feeExempt[account] = exempt;
    }
    
    function setMaxTxExempt(address account, bool exempt) external onlyOwner {
        maxTxExempt[account] = exempt;
    }
    
    function setMaxWalletExempt(address account, bool exempt) external onlyOwner {
        maxWalletExempt[account] = exempt;
    }
    
    function setAntiDumpExempt(address account, bool exempt) external onlyOwner {
        antiDumpExempt[account] = exempt;
    }
    
    function setUniswapV2Pair(address _pair) external onlyOwner {
        uniswapV2Pair = _pair;
    }
    
    function setAntiWhaleEnabled(bool _antiWhaleEnabled) external onlyOwner {
        antiWhaleEnabled = _antiWhaleEnabled;
    }
    
    function canSell(address account) external view returns (bool) {
        if (antiDumpExempt[account]) return true;
        uint256 timeSinceLastBuy = block.timestamp - lastBuyTimestamp[account];
        return timeSinceLastBuy >= ANTI_DUMP_DURATION;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
}
