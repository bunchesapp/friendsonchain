const { ethers } = require("hardhat")

const deployContract = async function (contractName, constructorArgs) {
  const factory = await ethers.getContractFactory(contractName)
  const contract = await factory.deploy(...(constructorArgs || []))
  await contract.deployed()
  return contract
}

module.exports = { deployContract }
