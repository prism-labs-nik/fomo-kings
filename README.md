# 👑 King-of-the-Hill (FOMO Kings)

A high-octane on-chain game built with Solidity, deployed to Base Mainnet. Last buyer becomes the king and wins the pot!

## Quick Start

```bash
npm install
npx hardhat compile
npx hardhat run scripts/deploy.js --network base
```

## Game Mechanics

### Buy Keys
- **Price:** 0.001 ETH per key
- **Action:** Call `buyKeys()` with any ETH amount >= 0.001
- **Effect:** Become the new king (if you're the last buyer within 5 minutes)
- **Multiplicity:** Buy multiple keys in one transaction
- **Timer Reset:** Each purchase resets the 5-minute countdown

### Time Window
- **Default:** 5 minutes (adjustable by owner)
- **Trigger:** Game ends if no purchases for 5 minutes
- **Countdown:** Real-time visible (blocks until end)

### Game Ends
- **Trigger:** 5 minutes pass with no new purchases
- **Winner:** Current king (last buyer)
- **Method:** Anyone can call `endGame()` to claim winnings
- **Auto-Restart:** New round starts immediately

### Payouts
- **40%** → King (last buyer)
- **30%** → Burned (value accumulation)
- **25%** → Dividend pool (split among all key holders)
- **5%** → Dev fee

## Example Gameplay

```
Game 1 (Round):
[00:00] Player A buys 5 keys (0.005 ETH) → Crowned king
[01:30] Player B buys 3 keys (0.003 ETH) → Becomes new king, timer resets
[06:30] 5 minutes pass with no purchases → Game ends!
[06:31] Anyone calls endGame() → Payouts distributed:
        - Player B (king) gets: 0.008 * 0.40 = 0.0032 ETH
        - Burned: 0.008 * 0.30 = 0.0024 ETH
        - Dividends: 0.008 * 0.25 = 0.002 ETH (split by keys)
        - Dev: 0.008 * 0.05 = 0.0004 ETH
[06:32] New game starts automatically (Round 2)
```

## Contract Interface

### User Functions
- `buyKeys()` (payable) — Buy keys and become king
- `endGame()` — Trigger payout and start new round
- `claimDividends()` — Claim accumulated rewards
- `getGameInfo()` — View game state
- `timeRemaining()` — Check seconds until game ends
- `isGameActive()` — Is a game in progress?
- `pendingDividends(address)` — Check unclaimed rewards
- `getTicketCount(address)` — Check key balance

### Admin Functions
- `setTimeWindow(uint256)` — Change time window (1-60 minutes)
- `setDevAddress(address)` — Change dev fee destination
- `pause()` / `unpause()` — Emergency pause
- (Owner only)

## Security Features

- ✅ **ReentrancyGuard** — Prevents reentrancy attacks
- ✅ **Ownable** — Restricted admin functions
- ✅ **State Management** — Safe pot distribution
- ✅ **Dividend Tracking** — Cross-round accumulation
- ✅ **Emergency Pause** — Pause/unpause mechanism

## Deployment

### Network: Base Mainnet
```
Chain ID: 8453
RPC: https://mainnet.base.org
Explorer: https://basescan.org
```

### Environment
```bash
# .env file
PRIVATE_KEY=your_private_key
BASE_RPC=https://mainnet.base.org
```

### Deploy
```bash
npx hardhat run scripts/deploy.js --network base
```

### Verify on BaseScan
```bash
npx hardhat verify --network base <CONTRACT_ADDRESS>
```

## Gas Costs (Estimated)

| Action | Gas | Cost (Base) |
|--------|-----|-----------|
| Deploy | 200k | ~$0.002 |
| buyKeys() | 80k | ~$0.0002 |
| endGame() | 150k | ~$0.0003 |
| claimDividends() | 60k | ~$0.0001 |

## Testing

```bash
npm install  # Install OpenZeppelin for tests
npx hardhat test
```

Tests cover:
- ✅ Key purchasing and king tracking
- ✅ Time window mechanics
- ✅ Game ending and payout distribution
- ✅ Dividend accumulation and claims
- ✅ Admin functions
- ✅ Reentrancy protection
- ✅ Edge cases (multiple rounds, large player counts)

## Architecture

```
KingOfTheHill.sol
├── Key Management (per-player tracking)
├── King State (current king + crown time)
├── Pot Management (current round + lifetime)
├── Dividend System (cross-round tracking)
├── Game Lifecycle (active → ended → restart)
├── Payout Distribution (40/30/25/5 split)
├── Admin Controls (owner-gated)
├── Emergency Functions (pause/unpause/withdraw)
└── Events (all state changes logged)
```

## How to Play

1. **Fund Wallet:** Get Base ETH (bridge or exchange)
2. **Visit Contract:** https://basescan.org/address/{CONTRACT_ADDRESS}
3. **Buy Keys:** Write Contract → `buyKeys()` → value 0.001 ETH
4. **Become King:** Confirm in MetaMask
5. **Watch Timer:** Check time remaining via `timeRemaining()`
6. **End Game:** Call `endGame()` when countdown reaches zero
7. **Claim Dividends:** Call `claimDividends()` to collect your share

## Economics

### Revenue Model
- **Dev Fee:** 5% per game
- **Value Accumulation:** 30% burned per game + dividends
- **Engagement:** Multiple rounds encourage repeated play

### Example Revenue
```
Scenario: 10 games, 1 ETH wagered per game
- Total wagered: 10 ETH
- Dev earned: 10 * 0.05 = 0.5 ETH
- Burned/accumulated: 10 * 0.30 = 3 ETH
- Dividend pool distributed: 10 * 0.25 = 2.5 ETH
```

## Future Improvements

- [ ] NFT king crowns (ERC-721)
- [ ] Leaderboards (all-time winners)
- [ ] Anti-whale mechanics (max keys per round)
- [ ] Progressive time windows (longer as game ages)
- [ ] ERC20 integration (buy with tokens)
- [ ] Chainlink Automation (auto-end games)

## Differences from Dice

| Feature | Dice | FOMO Kings |
|---------|------|-----------|
| Duration | Instant (1 block) | 5 minutes |
| Mechanics | 50/50 roll | Last-buyer race |
| Multiplier | 1.5x on win | 40% of pot |
| Speed | Fast | Engaging |
| Skill Factor | None | Timing/strategy |

## License

MIT

## Contact

Built by Prism Labs  
GitHub: [prism-labs-nik](https://github.com/prism-labs-nik)

---

**Status:** Ready to deploy on Base | Compiled ✅ | Tested ✅
