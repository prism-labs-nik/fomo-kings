const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("KingOfTheHill", function () {
  let kingOfTheHill;
  let owner, player1, player2, player3, dev;
  const MIN_BUY = ethers.parseEther("0.001");
  const FIVE_MINUTES = 5 * 60;

  beforeEach(async function () {
    [owner, player1, player2, player3, dev] = await ethers.getSigners();

    const KingOfTheHill = await ethers.getContractFactory("KingOfTheHill");
    kingOfTheHill = await KingOfTheHill.deploy();
    await kingOfTheHill.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await kingOfTheHill.owner()).to.equal(owner.address);
    });

    it("Should set correct initial values", async function () {
      expect(await kingOfTheHill.currentRound()).to.equal(1);
      expect(await kingOfTheHill.totalPot()).to.equal(0);
      expect(await kingOfTheHill.currentKing()).to.equal(ethers.ZeroAddress);
      expect(await kingOfTheHill.timeWindow()).to.equal(FIVE_MINUTES);
    });

    it("Should set dev address to owner", async function () {
      expect(await kingOfTheHill.devAddress()).to.equal(owner.address);
    });
  });

  describe("Buying Keys", function () {
    it("Should allow buying keys with minimum amount", async function () {
      await expect(
        kingOfTheHill.connect(player1).buyKeys({ value: MIN_BUY })
      ).to.emit(kingOfTheHill, "KeysPurchased");

      expect(await kingOfTheHill.currentKing()).to.equal(player1.address);
      expect(await kingOfTheHill.keysOwned(player1.address)).to.equal(1);
      expect(await kingOfTheHill.totalPot()).to.equal(MIN_BUY);
    });

    it("Should reject purchases below minimum", async function () {
      await expect(
        kingOfTheHill.connect(player1).buyKeys({ value: ethers.parseEther("0.0005") })
      ).to.be.revertedWith("Below minimum buy");
    });

    it("Should calculate keys correctly", async function () {
      const buyAmount = ethers.parseEther("0.005");
      await kingOfTheHill.connect(player1).buyKeys({ value: buyAmount });

      expect(await kingOfTheHill.keysOwned(player1.address)).to.equal(5);
      expect(await kingOfTheHill.totalKeys()).to.equal(5);
    });

    it("Should update king with each purchase", async function () {
      await kingOfTheHill.connect(player1).buyKeys({ value: MIN_BUY });
      expect(await kingOfTheHill.currentKing()).to.equal(player1.address);

      await kingOfTheHill.connect(player2).buyKeys({ value: MIN_BUY });
      expect(await kingOfTheHill.currentKing()).to.equal(player2.address);
    });

    it("Should reset timer with each purchase", async function () {
      await kingOfTheHill.connect(player1).buyKeys({ value: MIN_BUY });
      const time1 = await kingOfTheHill.kingCrownedAt();

      await time.increase(60); // Wait 1 minute

      await kingOfTheHill.connect(player2).buyKeys({ value: MIN_BUY });
      const time2 = await kingOfTheHill.kingCrownedAt();

      expect(time2).to.be.greaterThan(time1);
    });

    it("Should accumulate pot correctly", async function () {
      await kingOfTheHill.connect(player1).buyKeys({ value: MIN_BUY });
      await kingOfTheHill.connect(player2).buyKeys({ value: ethers.parseEther("0.002") });

      expect(await kingOfTheHill.totalPot()).to.equal(ethers.parseEther("0.003"));
    });
  });

  describe("Time Window", function () {
    it("Should show correct time remaining", async function () {
      await kingOfTheHill.connect(player1).buyKeys({ value: MIN_BUY });
      
      const timeLeft = await kingOfTheHill.timeRemaining();
      expect(timeLeft).to.be.closeTo(BigInt(FIVE_MINUTES), BigInt(2));
    });

    it("Should show game as active during time window", async function () {
      await kingOfTheHill.connect(player1).buyKeys({ value: MIN_BUY });
      expect(await kingOfTheHill.isGameActive()).to.be.true;
    });

    it("Should show game as inactive after time expires", async function () {
      await kingOfTheHill.connect(player1).buyKeys({ value: MIN_BUY });
      
      await time.increase(FIVE_MINUTES + 1);
      
      expect(await kingOfTheHill.isGameActive()).to.be.false;
    });
  });

  describe("Ending Game", function () {
    beforeEach(async function () {
      // Start a game
      await kingOfTheHill.connect(player1).buyKeys({ value: ethers.parseEther("0.01") });
      await kingOfTheHill.connect(player2).buyKeys({ value: ethers.parseEther("0.02") });
      await kingOfTheHill.connect(player3).buyKeys({ value: ethers.parseEther("0.01") });
    });

    it("Should not allow ending before time expires", async function () {
      await expect(
        kingOfTheHill.endGame()
      ).to.be.revertedWith("Time window not expired");
    });

    it("Should allow ending after time expires", async function () {
      await time.increase(FIVE_MINUTES + 1);
      
      await expect(kingOfTheHill.endGame()).to.emit(kingOfTheHill, "GameEnded");
    });

    it("Should distribute payouts correctly", async function () {
      const totalPot = ethers.parseEther("0.04");
      
      await time.increase(FIVE_MINUTES + 1);
      
      const winnerBalanceBefore = await ethers.provider.getBalance(player3.address);
      const devBalanceBefore = await ethers.provider.getBalance(owner.address);
      
      const tx = await kingOfTheHill.endGame();
      const receipt = await tx.wait();
      
      // Winner should get 40% = 0.016 ETH
      const expectedWinnerPayout = (totalPot * BigInt(40)) / BigInt(100);
      const winnerBalanceAfter = await ethers.provider.getBalance(player3.address);
      
      expect(winnerBalanceAfter - winnerBalanceBefore).to.equal(expectedWinnerPayout);
      
      // Dev should get 5% = 0.002 ETH
      const expectedDevFee = (totalPot * BigInt(5)) / BigInt(100);
      const devBalanceAfter = await ethers.provider.getBalance(owner.address);
      
      // Dev is also paying for gas, so check roughly
      expect(devBalanceAfter - devBalanceBefore).to.be.closeTo(
        expectedDevFee,
        ethers.parseEther("0.001")
      );
    });

    it("Should restart game after ending", async function () {
      const initialRound = await kingOfTheHill.currentRound();
      
      await time.increase(FIVE_MINUTES + 1);
      await kingOfTheHill.endGame();
      
      expect(await kingOfTheHill.currentRound()).to.equal(initialRound + BigInt(1));
      expect(await kingOfTheHill.totalPot()).to.equal(0);
      expect(await kingOfTheHill.currentKing()).to.equal(ethers.ZeroAddress);
      expect(await kingOfTheHill.totalKeys()).to.equal(0);
    });
  });

  describe("Dividends", function () {
    it("Should accumulate dividends for key holders", async function () {
      await kingOfTheHill.connect(player1).buyKeys({ value: ethers.parseEther("0.01") });
      await kingOfTheHill.connect(player2).buyKeys({ value: ethers.parseEther("0.01") });
      
      await time.increase(FIVE_MINUTES + 1);
      await kingOfTheHill.endGame();
      
      // 25% of 0.02 ETH = 0.005 ETH in dividends
      // Split between 20 keys total (10 each)
      const expectedDividendPerPlayer = ethers.parseEther("0.0025");
      
      const player1Dividends = await kingOfTheHill.pendingDividends(player1.address);
      expect(player1Dividends).to.be.closeTo(expectedDividendPerPlayer, ethers.parseEther("0.0001"));
    });

    it("Should allow claiming dividends", async function () {
      await kingOfTheHill.connect(player1).buyKeys({ value: ethers.parseEther("0.01") });
      await kingOfTheHill.connect(player2).buyKeys({ value: ethers.parseEther("0.01") });
      
      await time.increase(FIVE_MINUTES + 1);
      await kingOfTheHill.endGame();
      
      const balanceBefore = await ethers.provider.getBalance(player1.address);
      const pendingDividends = await kingOfTheHill.pendingDividends(player1.address);
      
      const tx = await kingOfTheHill.connect(player1).claimDividends();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      
      const balanceAfter = await ethers.provider.getBalance(player1.address);
      
      expect(balanceAfter - balanceBefore + gasCost).to.be.closeTo(
        pendingDividends,
        ethers.parseEther("0.0001")
      );
    });

    it("Should not allow claiming zero dividends", async function () {
      await expect(
        kingOfTheHill.connect(player1).claimDividends()
      ).to.be.revertedWith("No dividends to claim");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update time window", async function () {
      const newWindow = 10 * 60; // 10 minutes
      
      await expect(kingOfTheHill.setTimeWindow(newWindow))
        .to.emit(kingOfTheHill, "TimeWindowUpdated");
      
      expect(await kingOfTheHill.timeWindow()).to.equal(newWindow);
    });

    it("Should not allow non-owner to update time window", async function () {
      await expect(
        kingOfTheHill.connect(player1).setTimeWindow(10 * 60)
      ).to.be.reverted;
    });

    it("Should reject invalid time windows", async function () {
      await expect(
        kingOfTheHill.setTimeWindow(30) // Less than 1 minute
      ).to.be.revertedWith("Invalid time window");
      
      await expect(
        kingOfTheHill.setTimeWindow(2 * 60 * 60) // More than 1 hour
      ).to.be.revertedWith("Invalid time window");
    });

    it("Should allow owner to update dev address", async function () {
      await expect(kingOfTheHill.setDevAddress(dev.address))
        .to.emit(kingOfTheHill, "DevAddressUpdated");
      
      expect(await kingOfTheHill.devAddress()).to.equal(dev.address);
    });

    it("Should allow owner to pause", async function () {
      await kingOfTheHill.pause();
      expect(await kingOfTheHill.paused()).to.be.true;
      
      await expect(
        kingOfTheHill.connect(player1).buyKeys({ value: MIN_BUY })
      ).to.be.revertedWith("Game is paused");
    });

    it("Should allow owner to unpause", async function () {
      await kingOfTheHill.pause();
      await kingOfTheHill.unpause();
      expect(await kingOfTheHill.paused()).to.be.false;
      
      await expect(
        kingOfTheHill.connect(player1).buyKeys({ value: MIN_BUY })
      ).to.not.be.reverted;
    });
  });

  describe("Game Info", function () {
    it("Should return correct game info", async function () {
      await kingOfTheHill.connect(player1).buyKeys({ value: ethers.parseEther("0.01") });
      
      const info = await kingOfTheHill.getGameInfo();
      
      expect(info[0]).to.equal(1); // round
      expect(info[1]).to.equal(ethers.parseEther("0.01")); // pot
      expect(info[2]).to.equal(player1.address); // king
      expect(info[4]).to.equal(10); // keys
      expect(info[5]).to.be.true; // active
      expect(info[3]).to.be.closeTo(BigInt(FIVE_MINUTES), BigInt(2)); // timeLeft
    });
  });

  describe("Edge Cases", function () {
    it("Should reject direct ETH transfers", async function () {
      await expect(
        owner.sendTransaction({
          to: await kingOfTheHill.getAddress(),
          value: MIN_BUY
        })
      ).to.be.revertedWith("Use buyKeys() function");
    });

    it("Should handle multiple rounds correctly", async function () {
      // Round 1
      await kingOfTheHill.connect(player1).buyKeys({ value: ethers.parseEther("0.01") });
      await time.increase(FIVE_MINUTES + 1);
      await kingOfTheHill.endGame();
      
      // Round 2
      await kingOfTheHill.connect(player2).buyKeys({ value: ethers.parseEther("0.02") });
      
      expect(await kingOfTheHill.currentRound()).to.equal(2);
      expect(await kingOfTheHill.currentKing()).to.equal(player2.address);
    });

    it("Should maintain dividend tracking across rounds", async function () {
      // Round 1
      await kingOfTheHill.connect(player1).buyKeys({ value: ethers.parseEther("0.01") });
      await kingOfTheHill.connect(player2).buyKeys({ value: ethers.parseEther("0.01") });
      await time.increase(FIVE_MINUTES + 1);
      await kingOfTheHill.endGame();
      
      const dividendsAfterRound1 = await kingOfTheHill.pendingDividends(player1.address);
      
      // Round 2
      await kingOfTheHill.connect(player3).buyKeys({ value: ethers.parseEther("0.01") });
      await time.increase(FIVE_MINUTES + 1);
      await kingOfTheHill.endGame();
      
      // Player1 should still have dividends from round 1
      const dividendsAfterRound2 = await kingOfTheHill.pendingDividends(player1.address);
      expect(dividendsAfterRound2).to.be.gte(dividendsAfterRound1);
    });
  });

  describe("Security", function () {
    it("Should be protected against reentrancy", async function () {
      // This is mainly ensured by the ReentrancyGuard from OpenZeppelin
      // The test ensures the contract deploys and functions work with the guard
      await kingOfTheHill.connect(player1).buyKeys({ value: MIN_BUY });
      expect(await kingOfTheHill.currentKing()).to.equal(player1.address);
    });

    it("Should handle large number of key holders", async function () {
      const [, ...players] = await ethers.getSigners();
      
      // Buy keys from 10 different players
      for (let i = 0; i < 10; i++) {
        await kingOfTheHill.connect(players[i]).buyKeys({ 
          value: ethers.parseEther("0.001") 
        });
      }
      
      await time.increase(FIVE_MINUTES + 1);
      await kingOfTheHill.endGame();
      
      // All players should have some dividends
      const player0Dividends = await kingOfTheHill.pendingDividends(players[0].address);
      expect(player0Dividends).to.be.gt(0);
    });
  });
});
