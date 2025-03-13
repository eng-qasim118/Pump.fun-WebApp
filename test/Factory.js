const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers")
const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("Factory", function() {
    const fees = ethers.parseUnits("0.01", "ether")
    async function factoryFixture() {
        const [deployer, creator] = await ethers.getSigners()
        const Factory = await ethers.getContractFactory("Factory")
        const factory = await Factory.deploy(fees)
        const transaction = await factory.connect(creator).createToken("pepe_MEme", "PEPE", { value: fees })
        await transaction.wait()
        const getTokenAddress = await factory.tokens(0)
        const token = await ethers.getContractAt("Token", getTokenAddress)
        return { factory, deployer, token, creator }
    }

    describe("Deployment", function() {
        it("should set fee", async function() {
            const { factory } = await loadFixture(factoryFixture)
            expect(await factory.fees()).to.equal(fees)

        })
        it("should be the owner", async function() {
            const { factory, deployer } = await loadFixture(factoryFixture)
            expect(await factory.owner()).to.equal(deployer.address)
        })
    })
    describe("Creating", function() {
        it("should be the owner", async function() {
            const { factory, token } = await loadFixture(factoryFixture)
            expect(await token.owner()).to.equal(await factory.getAddress())
        })
        it("should be the creator", async function() {
            const { creator, token } = await loadFixture(factoryFixture)
            expect(await token.creator()).to.equal(await creator.getAddress())
        })
        it("Should set supply", async function() {
            const { factory, token } = await loadFixture(factoryFixture)
            const totalSupply = ethers.parseUnits("1000000", 18)
            expect(await token.balanceOf(await factory.getAddress())).to.equal(totalSupply)
        })

        it("Should set update ETH Balance", async function() {
            const { factory } = await loadFixture(factoryFixture)
            const Balance = await ethers.provider.getBalance(await factory.getAddress())
            expect(Balance).to.equal(fees)
        })

        it("Should set sale of token", async function() {
            const { factory, token, creator } = await loadFixture(factoryFixture)
            const count = await factory.totalTokens()
            expect(count).to.equal(1)
        })
    })

})