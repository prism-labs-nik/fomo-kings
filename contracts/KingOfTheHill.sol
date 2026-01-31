// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title KingOfTheHill (FOMO Kings)
 * @dev A king-of-the-hill game where players buy keys with ETH
 * Last buyer within the time window becomes king and wins the pot
 * 
 * Payout Distribution:
 * - 40% to the winner (last buyer)
 * - 30% burned (sent to dead address)
 * - 25% distributed to all key holders as dividends
 * - 5% to dev/contract owner
 * 
 * Game Mechanics:
 * - Minimum buy: 0.001 ETH
 * - Time window: 5 minutes (adjustable by owner)
 * - Game restarts automatically after a winner claims their prize
 * - Each key purchase extends the timer
 */
contract KingOfTheHill is ReentrancyGuard, Ownable {
    // ============ State Variables ============
    
    /// @notice Minimum ETH required to buy keys
    uint256 public constant MIN_BUY = 0.001 ether;
    
    /// @notice Dead address for burning ETH
    address public constant DEAD_ADDRESS = 0x000000000000000000000000000000000000dEaD;
    
    /// @notice Time window in seconds (default 5 minutes)
    uint256 public timeWindow = 5 minutes;
    
    /// @notice Current round number
    uint256 public currentRound;
    
    /// @notice Total pot for current round
    uint256 public totalPot;
    
    /// @notice Current king (last buyer)
    address public currentKing;
    
    /// @notice Timestamp when current king was crowned
    uint256 public kingCrownedAt;
    
    /// @notice Total keys in circulation for current round
    uint256 public totalKeys;
    
    /// @notice Mapping of address to keys owned in current round
    mapping(address => uint256) public keysOwned;
    
    /// @notice Mapping of address to unclaimed dividends
    mapping(address => uint256) public unclaimedDividends;
    
    /// @notice Dividend pool for current round
    uint256 public dividendPool;
    
    /// @notice Dividend per key (scaled by 1e18 for precision)
    uint256 public dividendPerKey;
    
    /// @notice Mapping of address to last dividend checkpoint
    mapping(address => uint256) public lastDividendPoints;
    
    /// @notice Dev address for collecting fees
    address public devAddress;
    
    /// @notice Whether the game is paused
    bool public paused;
    
    // ============ Events ============
    
    event KeysPurchased(
        address indexed buyer,
        uint256 amount,
        uint256 keysBought,
        uint256 newKingCrownedAt,
        uint256 round
    );
    
    event GameEnded(
        address indexed winner,
        uint256 winnerPayout,
        uint256 burned,
        uint256 dividends,
        uint256 devFee,
        uint256 round
    );
    
    event GameRestarted(uint256 newRound);
    
    event DividendsClaimed(address indexed claimer, uint256 amount);
    
    event TimeWindowUpdated(uint256 oldWindow, uint256 newWindow);
    
    event DevAddressUpdated(address indexed oldDev, address indexed newDev);
    
    event Paused();
    event Unpaused();
    
    // ============ Modifiers ============
    
    modifier whenNotPaused() {
        require(!paused, "Game is paused");
        _;
    }
    
    modifier gameActive() {
        require(currentKing != address(0), "Game not started");
        require(block.timestamp < kingCrownedAt + timeWindow, "Game ended");
        _;
    }
    
    // ============ Constructor ============
    
    constructor() Ownable(msg.sender) {
        devAddress = msg.sender;
        currentRound = 1;
    }
    
    // ============ Main Functions ============
    
    /**
     * @notice Buy keys with ETH
     * @dev Keys are calculated as 1 key per 0.001 ETH
     * Each purchase extends the timer and crowns a new king
     */
    function buyKeys() external payable nonReentrant whenNotPaused {
        require(msg.value >= MIN_BUY, "Below minimum buy");
        
        // Calculate keys (1 key = 0.001 ETH)
        uint256 keysToBuy = msg.value / MIN_BUY;
        require(keysToBuy > 0, "Must buy at least 1 key");
        
        // Update dividends for buyer before changing their key balance
        _updateDividends(msg.sender);
        
        // Update state
        totalPot += msg.value;
        totalKeys += keysToBuy;
        keysOwned[msg.sender] += keysToBuy;
        currentKing = msg.sender;
        kingCrownedAt = block.timestamp;
        
        emit KeysPurchased(
            msg.sender,
            msg.value,
            keysToBuy,
            kingCrownedAt,
            currentRound
        );
    }
    
    /**
     * @notice End the game and distribute payouts
     * @dev Can be called by anyone after the time window expires
     * Winner gets 40%, 30% burned, 25% to dividends, 5% to dev
     */
    function endGame() external nonReentrant whenNotPaused {
        require(currentKing != address(0), "Game not started");
        require(block.timestamp >= kingCrownedAt + timeWindow, "Time window not expired");
        require(totalPot > 0, "No pot to distribute");
        
        address winner = currentKing;
        uint256 pot = totalPot;
        uint256 roundNumber = currentRound;
        
        // Calculate payouts
        uint256 winnerPayout = (pot * 40) / 100;  // 40%
        uint256 burnAmount = (pot * 30) / 100;     // 30%
        uint256 dividendAmount = (pot * 25) / 100; // 25%
        uint256 devFee = (pot * 5) / 100;          // 5%
        
        // Add to dividend pool and calculate dividend per key
        if (totalKeys > 0 && dividendAmount > 0) {
            dividendPool += dividendAmount;
            dividendPerKey += (dividendAmount * 1e18) / totalKeys;
        }
        
        // Transfer payouts
        (bool successWinner, ) = payable(winner).call{value: winnerPayout}("");
        require(successWinner, "Winner payout failed");
        
        (bool successBurn, ) = payable(DEAD_ADDRESS).call{value: burnAmount}("");
        require(successBurn, "Burn failed");
        
        (bool successDev, ) = payable(devAddress).call{value: devFee}("");
        require(successDev, "Dev fee failed");
        
        emit GameEnded(
            winner,
            winnerPayout,
            burnAmount,
            dividendAmount,
            devFee,
            roundNumber
        );
        
        // Reset game for next round
        _restartGame();
    }
    
    /**
     * @notice Claim accumulated dividends
     */
    function claimDividends() external nonReentrant {
        _updateDividends(msg.sender);
        
        uint256 amount = unclaimedDividends[msg.sender];
        require(amount > 0, "No dividends to claim");
        
        unclaimedDividends[msg.sender] = 0;
        
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        require(success, "Dividend claim failed");
        
        emit DividendsClaimed(msg.sender, amount);
    }
    
    // ============ Internal Functions ============
    
    /**
     * @dev Update unclaimed dividends for an address
     */
    function _updateDividends(address account) internal {
        if (keysOwned[account] > 0) {
            uint256 owing = (keysOwned[account] * dividendPerKey) / 1e18 - lastDividendPoints[account];
            if (owing > 0) {
                unclaimedDividends[account] += owing;
            }
        }
        lastDividendPoints[account] = (keysOwned[account] * dividendPerKey) / 1e18;
    }
    
    /**
     * @dev Restart the game for a new round
     */
    function _restartGame() internal {
        currentRound++;
        totalPot = 0;
        currentKing = address(0);
        kingCrownedAt = 0;
        totalKeys = 0;
        // Note: keysOwned and dividends persist across rounds
        
        emit GameRestarted(currentRound);
    }
    
    // ============ View Functions ============
    
    /**
     * @notice Get time remaining in current round
     * @return Time remaining in seconds, 0 if game ended
     */
    function timeRemaining() external view returns (uint256) {
        if (currentKing == address(0)) {
            return 0;
        }
        
        uint256 endTime = kingCrownedAt + timeWindow;
        if (block.timestamp >= endTime) {
            return 0;
        }
        
        return endTime - block.timestamp;
    }
    
    /**
     * @notice Check if game is active
     */
    function isGameActive() external view returns (bool) {
        return currentKing != address(0) && block.timestamp < kingCrownedAt + timeWindow;
    }
    
    /**
     * @notice Get pending dividends for an address
     */
    function pendingDividends(address account) external view returns (uint256) {
        if (keysOwned[account] == 0) {
            return unclaimedDividends[account];
        }
        
        uint256 owing = (keysOwned[account] * dividendPerKey) / 1e18 - lastDividendPoints[account];
        return unclaimedDividends[account] + owing;
    }
    
    /**
     * @notice Get game info
     */
    function getGameInfo() external view returns (
        uint256 round,
        uint256 pot,
        address king,
        uint256 timeLeft,
        uint256 keys,
        bool active
    ) {
        round = currentRound;
        pot = totalPot;
        king = currentKing;
        
        if (currentKing != address(0) && block.timestamp < kingCrownedAt + timeWindow) {
            timeLeft = (kingCrownedAt + timeWindow) - block.timestamp;
            active = true;
        } else {
            timeLeft = 0;
            active = false;
        }
        
        keys = totalKeys;
    }
    
    // ============ Admin Functions ============
    
    /**
     * @notice Update time window
     * @param newWindow New time window in seconds
     */
    function setTimeWindow(uint256 newWindow) external onlyOwner {
        require(newWindow >= 1 minutes && newWindow <= 1 hours, "Invalid time window");
        
        uint256 oldWindow = timeWindow;
        timeWindow = newWindow;
        
        emit TimeWindowUpdated(oldWindow, newWindow);
    }
    
    /**
     * @notice Update dev address
     * @param newDev New dev address
     */
    function setDevAddress(address newDev) external onlyOwner {
        require(newDev != address(0), "Invalid address");
        
        address oldDev = devAddress;
        devAddress = newDev;
        
        emit DevAddressUpdated(oldDev, newDev);
    }
    
    /**
     * @notice Pause the game
     */
    function pause() external onlyOwner {
        paused = true;
        emit Paused();
    }
    
    /**
     * @notice Unpause the game
     */
    function unpause() external onlyOwner {
        paused = false;
        emit Unpaused();
    }
    
    /**
     * @notice Emergency withdraw (only if game is paused and no active round)
     */
    function emergencyWithdraw() external onlyOwner {
        require(paused, "Must be paused");
        require(currentKing == address(0), "Cannot withdraw during active game");
        
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Emergency withdraw failed");
    }
    
    // ============ Receive Function ============
    
    receive() external payable {
        revert("Use buyKeys() function");
    }
}
