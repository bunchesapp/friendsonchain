const { ethers, upgrades } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require("chai")

describe("FriendsOnChainV2", () => {
  async function deployFriendsOnChainV2() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners()

    const FriendsOnChainV2 = await ethers.getContractFactory("FriendsOnChainV2")
    const focV2 = await upgrades.deployProxy(FriendsOnChainV2, [])

    return { focV2, owner, addr1, addr2, addr3 }
  }

  context("addFriendToGroup()", async function () {
    context("error cases", async function () {
      it("Only Owner or Member of Group can call", async function () {
        const { focV2, addr1, addr2 } = await loadFixture(
          deployFriendsOnChainV2
        )
        await focV2.createGroup([addr1.address], { value: 0 })
        await expect(
          focV2.connect(addr2).addFriendToGroup(addr2.address, 1)
        ).to.be.revertedWith("Must be Owner or Group Member")
      })

      it("Cannot mint to address that is already a holder", async function () {
        const { focV2, addr1 } = await loadFixture(deployFriendsOnChainV2)
        await focV2.createGroup([addr1.address], { value: 0 })
        await expect(
          focV2.addFriendToGroup(addr1.address, 1, { value: 0 })
        ).to.be.revertedWith("Only 1 of each token is allowed per address")
      })

      it("errors when the wrong amount of ether is sent", async function () {
        const { focV2, addr1 } = await loadFixture(deployFriendsOnChainV2)
        await focV2.setPrice(ethers.utils.parseUnits("1.00", "ether"))
        await expect(
          focV2.createGroup([addr1.address], {
            value: 0
          })
        ).to.be.reverted
      })

      it("Cannot mint if maxOwners is exceeded", async function () {
        const { focV2, addr1, addr2 } = await loadFixture(
          deployFriendsOnChainV2
        )
        await focV2.setMaxOwners(1)
        await focV2.createGroup([addr1.address])
        await expect(
          focV2.addFriendToGroup(addr2.address, 1)
        ).to.be.revertedWith("Maximun number of owners exceeded")
      })
    })

    it("fires the FriendAddedToGroup event", async function () {
      const { focV2, addr1, addr2 } = await loadFixture(deployFriendsOnChainV2)
      await focV2.createGroup([addr1.address])
      await expect(focV2.addFriendToGroup(addr2.address, 1))
        .to.emit(focV2, "FriendAddedToGroup")
        .withArgs("1", addr2.address)
    })

    it("Updates onwersOfToken mapping", async function () {
      const { focV2, addr1, addr2 } = await loadFixture(deployFriendsOnChainV2)
      expect((await focV2.ownersOf(1)).length).to.equal(0)

      await focV2.createGroup([addr1.address])
      expect(await focV2.ownersOf(1)).to.eql([addr1.address])

      await focV2.addFriendToGroup(addr2.address, 1)
      expect(await focV2.ownersOf(1)).to.eql([addr1.address, addr2.address])
    })
  })
})
