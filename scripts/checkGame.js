const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0xD2acb56C0eAE98BCcBaD5db2e5d5A651CfE0Ea38";
  
  const KingOfTheHill = await ethers.getContractFactory("KingOfTheHill");
  const contract = KingOfTheHill.attach(contractAddress);
  
  console.log("Checking contract at:", contractAddress);
  
  const gameInfo = await contract.getGameInfo();
  console.log("\n📊 Current Game Info:");
  console.log("  Round:", gameInfo[0].toString());
  console.log("  Total Pot:", ethers.formatEther(gameInfo[1]), "ETH");
  console.log("  Current King:", gameInfo[2]);
  console.log("  Time Remaining:", gameInfo[3].toString(), "seconds");
  console.log("  Total Keys:", gameInfo[4].toString());
  console.log("  Game Active:", gameInfo[5]);
  
  const timeWindow = await contract.timeWindow();
  console.log("\n⏰ Time Window:", timeWindow.toString(), "seconds");
  
  const totalPot = await contract.totalPot();
  console.log("💰 Total Pot:", ethers.formatEther(totalPot), "ETH");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
