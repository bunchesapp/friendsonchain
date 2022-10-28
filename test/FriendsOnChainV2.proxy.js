const { ethers, upgrades } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require("chai")

describe("FriendsOnChainV2 (proxy)", () => {
  async function deployThenUpgradeFriendsOnChain() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners()

    const FriendsOnChain = await ethers.getContractFactory("FriendsOnChain")
    const FriendsOnChainV2 = await ethers.getContractFactory("FriendsOnChainV2")

    const foc = await upgrades.deployProxy(FriendsOnChain, [])
    foc.createGroup([addr1.address])

    const focV2 = await upgrades.upgradeProxy(foc.address, FriendsOnChainV2)

    return { focV2, owner, addr1, addr2, addr3 }
  }

  it("Can access a FOC minted on last implementation", async function () {
    const { focV2, addr1, addr2 } = await loadFixture(
      deployThenUpgradeFriendsOnChain
    )
    await focV2.addFriendToGroup(addr2.address, 1)
    expect(await focV2.isMember(addr1.address, 1)).to.equal(true)
    expect(await focV2.isMember(addr2.address, 1)).to.equal(true)
  })
})
