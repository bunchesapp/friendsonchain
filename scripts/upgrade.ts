// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat"

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const proxyAddress = "0x9fe46736679d2d9a65f0992f2272de9f3c7fa6e0"

  const FriendsOnChainV2 = await ethers.getContractFactory("FriendsOnChainV2")
  console.log("Preparing to upgrade...")
  const focV2 = await upgrades.upgradeProxy(proxyAddress, FriendsOnChainV2)

  console.log("FriendsOnChain upgrade to FriendsOnChainV2 at: ", focV2.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
