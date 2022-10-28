const { ethers, upgrades } = require("hardhat")
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const { expect } = require("chai")

describe("FriendsOnChain (proxy)", () => {
  async function deployFriendsOnChain() {
    const [owner, addr1, addr2, addr3] = await ethers.getSigners()

    const FriendsOnChain = await ethers.getContractFactory("FriendsOnChain")
    const foc = await upgrades.deployProxy(FriendsOnChain, [])

    return { foc, owner, addr1, addr2, addr3 }
  }

  context("createGroup()", async function () {
    context("error cases", async function () {
      it("errors when the wrong amount of ether is sent", async function () {
        const { foc, addr1 } = await loadFixture(deployFriendsOnChain)
        await foc.setPrice(ethers.utils.parseUnits("1.00", "ether"))
        await expect(
          foc.createGroup([addr1.address], {
            value: 0
          })
        ).to.be.reverted
      })

      // it("errors when too many addresses are specified", async function () {
      //   expect(
      //     this.contract.createGroup([this.addr1.address], "bafybeiekovx3i2bg2agc3rza3xbjabt4jg7wyg2uwxb5iv74kpz6zerure", {
      //       value: 0
      //     })
      //   ).to.be.revertedWith("Ether value sent is not correct")
      // })

      it("errors when max number of owners is exceeded", async function () {
        const { foc, addr1, addr2, addr3 } = await loadFixture(
          deployFriendsOnChain
        )
        await foc.setMaxOwners(2)
        await expect(
          foc.createGroup([addr1.address, addr2.address, addr3.address], {
            value: 0
          })
        ).to.be.revertedWith("Maximum number of owners exceeded")
      })

      it("errors when max supply is exceeded", async function () {
        const { foc, addr1 } = await loadFixture(deployFriendsOnChain)
        await foc.setMaxSupply(1)
        await foc.createGroup([addr1.address])
        await expect(
          foc.createGroup([addr1.address], {
            value: 0
          })
        ).to.be.revertedWith("Maximum number of tokens reached")
      })
    })

    it("fires the GroupCreate event", async function () {
      const { foc, addr1 } = await loadFixture(deployFriendsOnChain)
      expect(
        foc
          .connect(addr1)
          .createGroup([addr1.address])
          .then((res) => res.wait())
      )
        .to.emit(foc, "GroupCreate")
        .withArgs("1", [addr1.address])
    })
  })

  context("isMember()", async function () {
    context("by default", async function () {
      it("should not be a member", async function () {
        const { foc, addr1 } = await loadFixture(deployFriendsOnChain)
        expect(await foc.isMember(addr1.address, "1")).to.equal(false)
      })
    })
    context("after createGroup", async function () {
      it("isMember is true", async function () {
        const { foc, addr1, addr2 } = await loadFixture(deployFriendsOnChain)
        await foc.connect(addr1).createGroup([addr1.address])
        expect(await foc.isMember(addr1.address, "1")).to.equal(true)
        expect(await foc.isMember(addr2.address, "1")).to.equal(false)
      })
    })
  })
  context("price()", async function () {
    context("defaults", async function () {
      it("has the correct price", async function () {
        const { foc } = await loadFixture(deployFriendsOnChain)
        const price = await foc.price().then((res) => res / 1e18)
        expect(price).to.equal(0)
      })
    })

    it("should allow the price to be changed", async function () {
      const { foc } = await loadFixture(deployFriendsOnChain)

      expect(await foc.price()).to.equal(
        ethers.utils.parseUnits("0.00", "ether")
      )

      await foc.setPrice(ethers.utils.parseUnits("1.00", "ether"))

      expect(await foc.price()).to.equal(
        ethers.utils.parseUnits("1.00", "ether")
      )
    })
  })

  context("countGroups()", async function () {
    it("has 0 groups by default", async function () {
      const { foc } = await loadFixture(deployFriendsOnChain)
      const countGroups = await foc.countGroups()
      expect(countGroups).to.equal(0)
    })

    context("after createGroup", async function () {
      it("countGroups is 1", async function () {
        const { foc, addr1 } = await loadFixture(deployFriendsOnChain)
        await foc.connect(addr1).createGroup([addr1.address])
        const countGroups = await foc.countGroups()
        expect(countGroups).to.equal(1)
      })
    })
  })

  context("setPrice()", async function () {
    it("onlyOwner can setPrice", async function () {
      const { foc, addr1 } = await loadFixture(deployFriendsOnChain)
      await expect(
        foc.connect(addr1).setPrice(ethers.utils.parseUnits("1.00", "ether"))
      ).to.be.reverted
    })
  })

  context("setMaxSupply()", async function () {
    it("onlyOwner can setPrice", async function () {
      const { foc, addr1 } = await loadFixture(deployFriendsOnChain)
      await expect(foc.connect(addr1).setMaxSupply(1)).to.be.reverted
    })
  })

  context("setMaxOwners()", async function () {
    it("onlyOwner can setPrice", async function () {
      const { foc, addr1 } = await loadFixture(deployFriendsOnChain)
      await expect(foc.connect(addr1).setMaxOwners(1)).to.be.reverted
    })
  })
})
