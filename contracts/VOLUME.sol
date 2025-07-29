// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract VOLUME is ERC20, Ownable {
    uint256 public maxWalletPercent = 2;
    uint256 public buyLockTime = 3600;
    mapping(address => uint256) public lastBuyTime;
    uint256 public maxSellPercent = 1;
    uint256 public sellFeePercent = 5;
    address public feeReceiver;
    mapping(address => bool) public isExcludedFromLimits;
    mapping(address => bool) public isExcludedFromFees;
    mapping(address => bool) public isDexPair;
    bool public protectionEnabled = true;
    
    event ProtectionToggled(bool enabled);
    event LimitsUpdated(uint256 maxWallet, uint256 maxSell);
    event BuyLockUpdated(uint256 newLockTime);
    event DexPairSet(address pair, bool isPair);
    
    constructor(uint256 totalSupply) ERC20("Volume", "VLM") {
        _mint(msg.sender, totalSupply * 10**decimals());
        isExcludedFromLimits[msg.sender] = true;
        isExcludedFromLimits[address(this)] = true;
        isExcludedFromFees[msg.sender] = true;
        isExcludedFromFees[address(this)] = true;
        feeReceiver = msg.sender;
    }
    
    function _transfer(address from, address to, uint256 amount) internal override {
        if (protectionEnabled && !isExcludedFromLimits[from] && !isExcludedFromLimits[to]) {
            if (isDexPair[from] && !isDexPair[to]) {
                require(balanceOf(to) + amount <= totalSupply() * maxWalletPercent / 100, "Exceeds max wallet");
                lastBuyTime[to] = block.timestamp;
            }
            else if (!isDexPair[from] && isDexPair[to]) {
                require(block.timestamp >= lastBuyTime[from] + buyLockTime, "Cannot sell yet - timelock active");
                require(amount <= totalSupply() * maxSellPercent / 100, "Exceeds max sell amount");
                if (!isExcludedFromFees[from] && sellFeePercent > 0) {
                    uint256 feeAmount = amount * sellFeePercent / 100;
                    super._transfer(from, feeReceiver, feeAmount);
                    amount -= feeAmount;
                }
            }
            else if (!isDexPair[from] && !isDexPair[to]) {
                require(balanceOf(to) + amount <= totalSupply() * maxWalletPercent / 100, "Exceeds max wallet");
            }
        }
        super._transfer(from, to, amount);
    }
    
    function setProtection(bool _enabled) external onlyOwner {
        protectionEnabled = _enabled;
        emit ProtectionToggled(_enabled);
    }
    
    function setDexPair(address pair, bool isPair) external onlyOwner {
        isDexPair[pair] = isPair;
        if (isPair) {
            isExcludedFromLimits[pair] = true;
        }
        emit DexPairSet(pair, isPair);
    }
    
    function setBuyLockTime(uint256 _seconds) external onlyOwner {
        require(_seconds <= 86400, "Max 24 hours");
        require(_seconds >= 300, "Min 5 minutes");
        buyLockTime = _seconds;
        emit BuyLockUpdated(_seconds);
    }
    
    function setLimits(uint256 _maxWalletPercent, uint256 _maxSellPercent) external onlyOwner {
        require(_maxWalletPercent >= 1 && _maxWalletPercent <= 100, "Invalid wallet limit");
        require(_maxSellPercent >= 1 && _maxSellPercent <= 100, "Invalid sell limit");
        maxWalletPercent = _maxWalletPercent;
        maxSellPercent = _maxSellPercent;
        emit LimitsUpdated(_maxWalletPercent, _maxSellPercent);
    }
    
    function setSellFee(uint256 _percent) external onlyOwner {
        require(_percent <= 25, "Max 25% fee");
        sellFeePercent = _percent;
    }
    
    function setFeeReceiver(address _receiver) external onlyOwner {
        require(_receiver != address(0), "Invalid receiver");
        feeReceiver = _receiver;
    }
    
    function excludeFromLimits(address account, bool excluded) external onlyOwner {
        isExcludedFromLimits[account] = excluded;
    }
    
    function excludeFromFees(address account, bool excluded) external onlyOwner {
        isExcludedFromFees[account] = excluded;
    }
    
    function getTimeUntilSell(address user) external view returns (uint256) {
        if (lastBuyTime[user] == 0) return 0;
        uint256 timePassed = block.timestamp - lastBuyTime[user];
        if (timePassed >= buyLockTime) return 0;
        return buyLockTime - timePassed;
    }
    
    function canSell(address user) external view returns (bool) {
        if (isExcludedFromLimits[user]) return true;
        if (!protectionEnabled) return true;
        if (lastBuyTime[user] == 0) return true;
        return block.timestamp >= lastBuyTime[user] + buyLockTime;
    }
}
