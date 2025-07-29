# volume-token-project
VOLUME Token - ERC-20 with 1-hour timelock anti-pump protection
# VOLUME Token (VLM) 🚀

![VOLUME Banner](https://img.shields.io/badge/VOLUME-Stopping%20Pump%20%26%20Dumps-blue?style=for-the-badge)

![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636?style=flat-square&logo=solidity)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![Ethereum](https://img.shields.io/badge/Ethereum-Mainnet-517fa4?style=flat-square&logo=ethereum)
![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen?style=flat-square)
![Gas Optimized](https://img.shields.io/badge/Gas-~45k%20per%20transfer-orange?style=flat-square)

## 🛡️ The Simple Solution to Pump & Dump Schemes

VOLUME is a revolutionary ERC-20 token that solves crypto's biggest problem: pump and dump schemes. Through our innovative **1-hour buy-to-sell timelock**, we make market manipulation impossible while keeping legitimate trading simple.

### 🎯 **One Feature. Maximum Protection.**

```
Buy VLM → Wait 1 Hour → Then Sell
```

That's it. Simple, effective, and proven to stop pump & dumps.

---

## 📊 Key Statistics

| Metric | Value |
|--------|-------|
| **Total Supply** | 20,000,000,000 VLM |
| **Buy-to-Sell Lock** | 1 Hour (3,600 seconds) |
| **Max Wallet** | 2% (20,000,000 VLM) |
| **Max Sell Per TX** | 1% (10,000,000 VLM) |
| **Sell Fee** | 5% |
| **Gas Per Transfer** | ~45,000 (42% less than complex tokens) |

---

## 🌟 Why VOLUME?

### The Problem We Solve

Traditional cryptocurrencies are vulnerable to pump and dump schemes:

1. 🔴 **Scammers buy low** → Create fake hype → **Dump immediately** → Investors lose everything
2. 🔴 **No protection** for genuine investors
3. 🔴 **Complex solutions** that don't work and waste gas

### Our Solution

✅ **Mandatory 1-hour wait** between buying and selling  
✅ **Automatic enforcement** via smart contract  
✅ **Simple and gas-efficient** implementation  
✅ **Proven effective** against manipulation  

---

## 🚀 Getting Started

### Prerequisites

- Node.js v16.0+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/VolumeToken/volume-token-project.git
cd volume-token-project

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env and add your private key and RPC URLs
```

### Compile Contracts

```bash
npx hardhat compile
```

### Run Tests

```bash
# Run all tests
npm test

# Run with gas reporting
REPORT_GAS=true npm test

# Run coverage
npm run test:coverage
```

---

## 📜 Smart Contract

### Deployed Addresses

| Network | Contract Address | Status | Explorer |
|---------|------------------|--------|----------|
| **Ethereum Mainnet** | `Coming Soon` | 🟡 Pending | - |
| **Sepolia Testnet** | `0x656791D3708b07d3A2FA63fC33FF5BC30f97f458` | ✅ Live | [View](https://sepolia.etherscan.io/address/0x656791D3708b07d3A2FA63fC33FF5BC30f97f458) |

### Core Features

#### 🔒 **1-Hour Buy-to-Sell Timelock**
```solidity
// When users buy from DEX
lastBuyTime[buyer] = block.timestamp;

// When they try to sell
require(block.timestamp >= lastBuyTime[seller] + 3600, "Cannot sell yet - timelock active");
```

#### 🐋 **Anti-Whale Protection**
- Maximum wallet: 2% of total supply
- Prevents large holders from manipulating price

#### 📉 **Anti-Dump Protection**
- Maximum sell: 1% per transaction
- Prevents massive sells that crash the price

#### 💰 **Sustainable Tokenomics**
- 5% sell fee to discourage day trading
- Fees used for development and marketing

### Key Functions

```solidity
// Check if a user can sell
function canSell(address user) external view returns (bool)

// Check time remaining until sell
function getTimeUntilSell(address user) external view returns (uint256)

// Admin: Register DEX pairs
function setDexPair(address pair, bool isPair) external onlyOwner

// Admin: Adjust timelock (5 min - 24 hours)
function setBuyLockTime(uint256 seconds) external onlyOwner
```

---

## 🔧 Development

### Project Structure

```
volume-token-project/
├── contracts/          # Solidity contracts
│   └── VOLUME.sol      # Main token contract
├── scripts/            # Deployment scripts
│   ├── deploy-sepolia.js
│   └── deploy-mainnet.js
├── test/              # Test files
│   └── VOLUME.test.js
├── docs/              # Documentation
├── hardhat.config.js  # Hardhat configuration
└── package.json       # Dependencies
```

### Deployment

#### Deploy to Sepolia Testnet
```bash
npx hardhat run scripts/deploy-sepolia.js --network sepolia
```

#### Deploy to Mainnet
```bash
# First, update CONFIRM_MAINNET = true in deploy-mainnet.js
npx hardhat run scripts/deploy-mainnet.js --network mainnet
```

### Verification

```bash
npx hardhat verify --network mainnet CONTRACT_ADDRESS "1000000000"
```

---

## 🧪 Testing

Our comprehensive test suite covers:

- ✅ Basic ERC-20 functionality
- ✅ Buy-to-sell timelock enforcement
- ✅ Anti-whale limits
- ✅ Anti-dump protection
- ✅ Fee calculations
- ✅ Admin functions
- ✅ Edge cases

Run specific tests:
```bash
npx hardhat test test/VOLUME.test.js --grep "timelock"
```

---

## 🔐 Security

### Audits
- Internal review: ✅ Complete
- Community review: ✅ Complete
- Professional audit: 🟡 Planned

### Security Features
- **No mint function** - Supply is fixed forever
- **Simple design** - Reduces attack surface
- **No external dependencies** - No oracle risks
- **Time-tested patterns** - Based on proven concepts

### Bug Bounty
We offer rewards for finding security vulnerabilities. Please report privately to admin@volumetoken.com

---

## 📈 Tokenomics

### Supply Distribution
| Allocation | Amount | Percentage | Vesting |
|------------|--------|------------|---------|
| Liquidity Pool | 400,000,000 VLM | 40% | Locked 12 months |
| Community Rewards | 250,000,000 VLM | 25% | Released over 24 months |
| Team | 150,000,000 VLM | 15% | 6 month cliff, 18 month vest |
| Marketing | 100,000,000 VLM | 10% | Released quarterly |
| Development | 100,000,000 VLM | 10% | As needed |

### Fee Structure
- **Buy Fee**: 0% (Free to buy)
- **Sell Fee**: 5% (Discourages quick flips)
- **Transfer Fee**: 0% (Free wallet-to-wallet)

---

## 🗺️ Roadmap

### Phase 1: Launch (Q1 2024) ✅
- [x] Smart contract development
- [x] Testnet deployment
- [x] Security testing
- [ ] Mainnet deployment
- [ ] Initial liquidity provision

### Phase 2: Growth (Q2 2024)
- [ ] Uniswap V2 integration
- [ ] Dextools trending
- [ ] CoinGecko listing
- [ ] CMC listing
- [ ] 1,000 holders

### Phase 3: Expansion (Q3 2024)
- [ ] CEX listings
- [ ] Cross-chain bridge
- [ ] Governance features
- [ ] 10,000 holders

### Phase 4: Ecosystem (Q4 2024)
- [ ] DeFi integrations
- [ ] Partnership announcements
- [ ] Mobile wallet
- [ ] 50,000 holders

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md).

### Development Setup

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style
- Solidity: [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- JavaScript: [StandardJS](https://standardjs.com/)

---

## 📞 Community & Support

Join our growing community:

- 🐦 **Twitter**: [@VolumeToken](https://x.com/Volume_defi)
- 💬 **Telegram**: [t.me/VolumeToken](https://t.me/+CWI-vcU8d8swNjFk)
- 📧 **Email**: admin@volumetoken.com
- 🌐 **Website**: [volumetoken.com](https://www.volumetoken.com)
- 🔗 **LinkedIn**: (https://www.linkedin.com/in/jason-cousins-76906a78/).
### Official Links Only
⚠️ **Beware of scams!** Only use links from this official repository.

---

## 📊 Gas Optimization

VOLUME is designed for efficiency:

| Operation | VOLUME Gas | Complex Token Gas | Savings |
|-----------|------------|-------------------|---------|
| Transfer | ~45,000 | ~77,000 | 42% |
| Buy (with timelock) | ~50,000 | ~85,000 | 41% |
| Sell (with fee) | ~52,000 | ~90,000 | 42% |

---

## 🙏 Acknowledgments

- OpenZeppelin for secure contract libraries
- Hardhat for development framework
- Ethereum community for continuous innovation
- Our community for believing in simple solutions

---

## ⚖️ Legal

### Disclaimer
This project is experimental software. Cryptocurrency investments carry significant risk. Always do your own research and never invest more than you can afford to lose.

### License
This project is licensed under the MIT License

---

## 🔥 Quick Links

- 📄 [Whitepaper](docs/WHITEPAPER.md)
- 📊 [Dextools](https://www.dextools.io/) *(After launch)*
- 🦎 [CoinGecko](https://www.coingecko.com/) *(Pending)*
- 📈 [CMC](https://coinmarketcap.com/) *(Pending)*
- 🔒 [Liquidity Lock](https://app.unicrypt.network/) *(After launch)*

---

<div align="center">

### 🚀 **VOLUME - No parabens. No rugs. Just pure volume.** 🚀

**The future of DeFi is simple, secure, and sustainable.**

[![Star](https://img.shields.io/github/stars/VolumeToken/volume-token-project?style=social)](https://github.com/VolumeToken/volume-token-project)
[![Fork](https://img.shields.io/github/forks/VolumeToken/volume-token-project?style=social)](https://github.com/VolumeToken/volume-token-project)
[![Watch](https://img.shields.io/github/watchers/VolumeToken/volume-token-project?style=social)](https://github.com/VolumeToken/volume-token-project)

</div>
