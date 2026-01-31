# 🚀 Deployment Information

## Contract Details

**Contract Name:** KingOfTheHill (FOMO Kings)  
**Network:** Base Mainnet  
**Chain ID:** 8453  
**Contract Address:** `0xD2acb56C0eAE98BCcBaD5db2e5d5A651CfE0Ea38`

## Deployment Summary

**Deployed:** January 31, 2026  
**Deployer:** `0x9BcBB9ffc677CEE5ed7a8F770ae2DDCbD9cbCAFf`  
**Initial Seed:** 0.001 ETH (1 key)  
**Deployment Gas:** ~1,353,299 gas

## Network Information

- **RPC URL:** https://mainnet.base.org
- **Block Explorer:** https://basescan.org
- **Chain ID:** 8453

## Contract Links

- **BaseScan:** https://basescan.org/address/0xD2acb56C0eAE98BCcBaD5db2e5d5A651CfE0Ea38
- **GitHub Repo:** https://github.com/prism-labs-nik/fomo-kings

## Contract Configuration

| Parameter | Value | Notes |
|-----------|-------|-------|
| Min Buy | 0.001 ETH | 1 key minimum |
| Time Window | 5 minutes | Adjustable by owner |
| Winner Payout | 40% | Of total pot |
| Burn Amount | 30% | Sent to dead address |
| Dividend Pool | 25% | Distributed to key holders |
| Dev Fee | 5% | To contract owner |

## Verified Contract ABI

The contract ABI is available in the `artifacts/contracts/KingOfTheHill.sol/KingOfTheHill.json` file after compilation.

Key functions:

```solidity
// Player Functions
function buyKeys() external payable
function claimDividends() external
function endGame() external

// View Functions
function getGameInfo() external view returns (
    uint256 round,
    uint256 pot,
    address king,
    uint256 timeLeft,
    uint256 keys,
    bool active
)
function timeRemaining() external view returns (uint256)
function isGameActive() external view returns (bool)
function pendingDividends(address account) external view returns (uint256)
function keysOwned(address account) external view returns (uint256)

// Admin Functions (Owner Only)
function setTimeWindow(uint256 newWindow) external
function setDevAddress(address newDev) external
function pause() external
function unpause() external
```

## Security Audit Status

⚠️ **Not Audited** - This contract has not undergone a formal security audit. Use at your own risk.

### Security Measures Implemented

- ✅ OpenZeppelin ReentrancyGuard
- ✅ OpenZeppelin Ownable (access control)
- ✅ Solidity 0.8.20 (native overflow protection)
- ✅ Input validation on all functions
- ✅ Emergency pause mechanism
- ✅ Comprehensive test suite (31 tests)

## Initial Game State

After deployment:

```
Round: 1
Total Pot: 0.001 ETH
Current King: 0x9BcBB9ffc677CEE5ed7a8F770ae2DDCbD9cbCAFf
Time Remaining: ~5 minutes
Total Keys: 1
Game Active: true
```

## How to Interact

### Web3 Integration

```javascript
// Contract address
const CONTRACT_ADDRESS = "0xD2acb56C0eAE98BCcBaD5db2e5d5A651CfE0Ea38";

// Minimal ABI for key functions
const ABI = [
  "function buyKeys() external payable",
  "function claimDividends() external",
  "function endGame() external",
  "function getGameInfo() external view returns (uint256, uint256, address, uint256, uint256, bool)",
  "function pendingDividends(address) external view returns (uint256)",
  "function keysOwned(address) external view returns (uint256)"
];

// Create contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

// Buy keys
await contract.buyKeys({ value: ethers.parseEther("0.005") });

// Check game info
const [round, pot, king, timeLeft, keys, active] = await contract.getGameInfo();
```

### Using Hardhat Console

```bash
npx hardhat console --network base
```

```javascript
const contract = await ethers.getContractAt(
  "KingOfTheHill",
  "0xD2acb56C0eAE98BCcBaD5db2e5d5A651CfE0Ea38"
);

// Buy keys
await contract.buyKeys({ value: ethers.parseEther("0.001") });

// Check game info
const info = await contract.getGameInfo();
console.log(info);
```

## Deployment Cost Breakdown

| Item | Gas Used | ETH Cost* |
|------|----------|-----------|
| Contract Deployment | 1,353,299 | ~0.0068 ETH |
| Initial Seed (buyKeys) | 146,194 | ~0.0007 ETH |
| **Total** | **1,499,493** | **~0.0075 ETH** |

*Estimated at 0.5 gwei gas price on Base

## Owner/Admin Address

**Current Owner:** `0x9BcBB9ffc677CEE5ed7a8F770ae2DDCbD9cbCAFf`  
**Dev Address:** Same as owner (can be updated)

## Post-Deployment Checklist

- ✅ Contract deployed to Base mainnet
- ✅ Initial seed transaction confirmed
- ✅ Game started (Round 1 active)
- ✅ GitHub repository created and code pushed
- ✅ README and documentation completed
- ✅ Test suite verified (31/31 passing)
- ✅ License added (MIT)
- ⏳ Contract verification on BaseScan (optional)
- ⏳ Security audit (recommended before production)

## Future Maintenance

### Recommended Actions

1. **Verify Contract on BaseScan**
   - Allows users to read contract directly on block explorer
   - Increases trust and transparency

2. **Monitor Contract Activity**
   - Track game rounds
   - Monitor pot sizes
   - Watch for any unusual activity

3. **Security Review**
   - Consider professional audit if contract gains traction
   - Bug bounty program

4. **Community Building**
   - Create Discord/Telegram for players
   - Build web interface/dApp
   - Marketing and outreach

## Emergency Procedures

### If Emergency Pause Needed

```javascript
// Connect as owner
const contract = await ethers.getContractAt("KingOfTheHill", CONTRACT_ADDRESS);

// Pause the game
await contract.pause();

// Resume later
await contract.unpause();
```

### If Dev Address Needs Update

```javascript
await contract.setDevAddress("NEW_ADDRESS");
```

### If Time Window Needs Adjustment

```javascript
// Set to 10 minutes (600 seconds)
await contract.setTimeWindow(600);
```

## Support & Resources

- **Contract:** https://basescan.org/address/0xD2acb56C0eAE98BCcBaD5db2e5d5A651CfE0Ea38
- **GitHub:** https://github.com/prism-labs-nik/fomo-kings
- **Base Docs:** https://docs.base.org
- **Hardhat Docs:** https://hardhat.org

---

**Deployed:** January 31, 2026  
**Version:** 1.0.0  
**Status:** 🟢 Active on Base Mainnet
