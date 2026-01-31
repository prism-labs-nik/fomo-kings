# 👑 KingOfTheHill (FOMO Kings)

A FOMO3D-inspired king-of-the-hill game on Base mainnet where players compete to be the last buyer and claim the prize pot.

## 🎮 How It Works

Players buy keys with ETH. Each purchase:
- Crowns a new king (the buyer)
- Extends the timer by resetting it to 5 minutes
- Adds to the growing prize pot

When the timer expires, the last buyer (current king) wins **40% of the pot**. The game then automatically restarts for a new round.

## 📊 Contract Details

**🔗 Deployed Contract:** [`0xD2acb56C0eAE98BCcBaD5db2e5d5A651CfE0Ea38`](https://basescan.org/address/0xD2acb56C0eAE98BCcBaD5db2e5d5A651CfE0Ea38)  
**⛓️ Network:** Base Mainnet (Chain ID: 8453)  
**💎 Minimum Buy:** 0.001 ETH (1 key)  
**⏰ Time Window:** 5 minutes (adjustable by owner)

## 💰 Payout Distribution

When a round ends:

| Recipient | Percentage | Purpose |
|-----------|-----------|---------|
| 👑 **Winner** | 40% | Last buyer before timer expires |
| 🔥 **Burned** | 30% | Sent to dead address (deflationary) |
| 💎 **Key Holders** | 25% | Distributed as dividends to all key holders |
| 🛠️ **Dev** | 5% | Development and maintenance |

## 🚀 Quick Start

### For Players

#### Buy Keys (Web3)

```javascript
// Using ethers.js
const contract = new ethers.Contract(
  "0xD2acb56C0eAE98BCcBaD5db2e5d5A651CfE0Ea38",
  ABI,
  signer
);

// Buy 5 keys (0.005 ETH)
await contract.buyKeys({ value: ethers.parseEther("0.005") });
```

#### Check Game Status

```javascript
const gameInfo = await contract.getGameInfo();
console.log({
  round: gameInfo[0].toString(),
  pot: ethers.formatEther(gameInfo[1]),
  king: gameInfo[2],
  timeLeft: gameInfo[3].toString() + " seconds",
  totalKeys: gameInfo[4].toString(),
  active: gameInfo[5]
});
```

#### Claim Dividends

```javascript
// Check pending dividends
const pending = await contract.pendingDividends(yourAddress);
console.log("Pending:", ethers.formatEther(pending), "ETH");

// Claim dividends
await contract.claimDividends();
```

### For Developers

#### Installation

```bash
git clone https://github.com/prism-labs-nik/fomo-kings.git
cd fomo-kings
npm install
```

#### Run Tests

```bash
npx hardhat test
```

All 31 tests should pass! See [TESTING.md](./TESTING.md) for detailed testing guide.

#### Deploy to Testnet

```bash
# Configure .env
echo "PRIVATE_KEY=your_private_key" > .env

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia
```

## 📋 Contract Functions

### Player Functions

| Function | Parameters | Description |
|----------|-----------|-------------|
| `buyKeys()` | `payable` | Buy keys with ETH (min 0.001 ETH) |
| `claimDividends()` | - | Claim accumulated dividends |
| `endGame()` | - | End game after timer expires (anyone can call) |

### View Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `getGameInfo()` | `(round, pot, king, timeLeft, keys, active)` | Complete game state |
| `timeRemaining()` | `uint256` | Seconds until game ends |
| `isGameActive()` | `bool` | Whether game is currently active |
| `pendingDividends(address)` | `uint256` | Unclaimed dividends for address |
| `keysOwned(address)` | `uint256` | Number of keys owned by address |

### Admin Functions (Owner Only)

| Function | Parameters | Description |
|----------|-----------|-------------|
| `setTimeWindow(uint256)` | `newWindow` | Update time window (1 min - 1 hour) |
| `setDevAddress(address)` | `newDev` | Update dev fee recipient |
| `pause()` | - | Pause the game |
| `unpause()` | - | Unpause the game |
| `emergencyWithdraw()` | - | Emergency withdraw (paused + no active game) |

## 🔐 Security Features

- ✅ **ReentrancyGuard:** Protection against reentrancy attacks on all state-changing functions
- ✅ **Access Control:** OpenZeppelin Ownable for admin functions
- ✅ **SafeMath:** Solidity 0.8.20 native overflow protection
- ✅ **Emergency Pause:** Owner can pause game in emergencies
- ✅ **Input Validation:** All functions validate inputs
- ✅ **Audited Patterns:** Uses battle-tested OpenZeppelin contracts

## 🎯 Game Mechanics

### Key Pricing

Keys are priced at **1 key = 0.001 ETH**. You can buy multiple keys in one transaction:

- 0.001 ETH = 1 key
- 0.005 ETH = 5 keys
- 0.010 ETH = 10 keys
- etc.

### Becoming King

Every purchase crowns a new king. The timer resets to 5 minutes with each purchase, giving others a chance to steal the crown.

### Winning

If the timer expires and you're the current king, you win! Call `endGame()` (or anyone can) to:
1. Distribute payouts (40% to you!)
2. Send dividends to key holders
3. Burn 30% of the pot
4. Send 5% to dev
5. Restart the game automatically

### Dividends

Key holders earn 25% of every pot as dividends. The more keys you hold, the larger your share. Dividends persist across rounds—claim them anytime!

## 📈 Example Round

```
Round 1 Starts:
├─ Player A buys 10 keys (0.01 ETH) → King 👑, Timer: 5:00
├─ Player B buys 5 keys (0.005 ETH) → King 👑, Timer: 5:00
├─ Player C buys 3 keys (0.003 ETH) → King 👑, Timer: 5:00
└─ Timer expires... 🔔

Payouts:
├─ Player C (Winner): 0.0072 ETH (40%)
├─ Burned: 0.0054 ETH (30%)
├─ Dividends: 0.0045 ETH (25%) → Split among 18 keys
│  ├─ Player A: ~0.0025 ETH (10 keys)
│  ├─ Player B: ~0.00125 ETH (5 keys)
│  └─ Player C: ~0.00075 ETH (3 keys)
└─ Dev: 0.0009 ETH (5%)

Round 2 Starts... 🔄
```

## 🛠️ Technology Stack

- **Smart Contract:** Solidity 0.8.20
- **Framework:** Hardhat
- **Testing:** Chai, Hardhat Network Helpers
- **Dependencies:** OpenZeppelin Contracts (ReentrancyGuard, Ownable)
- **Network:** Base (Ethereum L2)

## 📊 Gas Costs

Based on test runs:

| Action | Gas Cost | ETH Cost* |
|--------|----------|-----------|
| Deploy Contract | ~1,353,299 | ~$0.05 |
| Buy Keys (First) | ~146,194 | ~$0.005 |
| Buy Keys (Subsequent) | ~77,794 | ~$0.003 |
| End Game | ~134,431 | ~$0.005 |
| Claim Dividends | ~67,947 | ~$0.002 |

*Estimated at 0.5 gwei gas price on Base

## 🧪 Testing

We have **31 comprehensive tests** covering:

- ✅ Deployment & initialization
- ✅ Key buying mechanics
- ✅ Time window & game lifecycle
- ✅ Payout distribution
- ✅ Dividend calculation & claiming
- ✅ Admin functions & access control
- ✅ Edge cases & multi-round games
- ✅ Security (reentrancy, etc.)

Run tests:
```bash
npx hardhat test
```

See [TESTING.md](./TESTING.md) for detailed testing guide.

## 🔮 Future Enhancements

Potential v2 features:

- 🎨 NFT rewards for winners
- 📈 Dynamic key pricing (bonding curve)
- 🎁 Referral rewards
- 🌐 Multi-chain deployment
- 📱 Web interface/dApp
- 🤖 Telegram/Discord bot integration

## ⚠️ Disclaimer

This is a **high-risk game** where you can lose all your ETH. Only play with what you can afford to lose. The contract is provided "as is" without warranty. While security best practices were followed, no audit has been performed. DYOR (Do Your Own Research).

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/prism-labs-nik/fomo-kings/issues)
- **Contract:** [BaseScan](https://basescan.org/address/0xD2acb56C0eAE98BCcBaD5db2e5d5A651CfE0Ea38)

## 🎉 Credits

Inspired by FOMO3D and built for the Base ecosystem.

---

**Built with ❤️ on Base** | **Contract:** `0xD2acb56C0eAE98BCcBaD5db2e5d5A651CfE0Ea38`
