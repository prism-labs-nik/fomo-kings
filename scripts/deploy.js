const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying KingOfTheHill to Base mainnet...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "ETH");
  
  // Deploy contract
  const KingOfTheHill = await ethers.getContractFactory("KingOfTheHill");
  const kingOfTheHill = await KingOfTheHill.deploy();
  
  await kingOfTheHill.waitForDeployment();
  const contractAddress = await kingOfTheHill.getAddress();
  
  console.log("✅ KingOfTheHill deployed to:", contractAddress);
  
  // Seed with initial ETH
  console.log("\nSeeding contract with initial buy...");
  const seedAmount = ethers.parseEther("0.001");
  const tx = await kingOfTheHill.buyKeys({ value: seedAmount });
  await tx.wait();
  
  console.log("✅ Seeded with", ethers.formatEther(seedAmount), "ETH");
  
  // Display game info
  const gameInfo = await kingOfTheHill.getGameInfo();
  console.log("\n📊 Game Info:");
  console.log("  Round:", gameInfo.round.toString());
  console.log("  Total Pot:", ethers.formatEther(gameInfo.pot), "ETH");
  console.log("  Current King:", gameInfo.king);
  console.log("  Time Remaining:", gameInfo.timeLeft.toString(), "seconds");
  console.log("  Total Keys:", gameInfo.keys.toString());
  console.log("  Game Active:", gameInfo.active);
  
  console.log("\n📝 Contract Details:");
  console.log("  Network: Base Mainnet (Chain ID: 8453)");
  console.log("  Contract Address:", contractAddress);
  console.log("  Min Buy:", "0.001 ETH");
  console.log("  Time Window:", "5 minutes");
  console.log("\n  Payout Distribution:");
  console.log("    - 40% to winner");
  console.log("    - 30% burned");
  console.log("    - 25% to key holders (dividends)");
  console.log("    - 5% to dev");
  
  console.log("\n🔗 Block Explorer:");
  console.log("  https://basescan.org/address/" + contractAddress);
  
  console.log("\n⚠️  SAVE THIS CONTRACT ADDRESS: " + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
