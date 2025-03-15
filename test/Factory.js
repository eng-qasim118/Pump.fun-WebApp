const { loadFixture } = require("@nomicfoundation/hardhat-toolbox/network-helpers")
const { expect } = require("chai")
const { ethers } = require("hardhat")

describe("Factory", function() {
    const fees = ethers.parseUnits("0.01", "ether")
    async function factoryFixture() {
        const [deployer, creator, buyer] = await ethers.getSigners()
        const Factory = await ethers.getContractFactory("Factory")
        const factory = await Factory.deploy(fees)
        const transaction = await factory.connect(creator).createToken("pepe_MEme", "PEPE", { value: fees })
        await transaction.wait()
        const getTokenAddress = await factory.tokens(0)
        const token = await ethers.getContractAt("Token", getTokenAddress)
        return { factory, deployer, token, creator, buyer }
    }

    async function buyTokenFixture() {
        const { factory, token, creator, buyer } = await factoryFixture()
        const ammount = ethers.parseUnits("10000", 18)
        const cost = ethers.parseUnits("1", 18)
        const transaction = await factory.connect(buyer).buyTOken(await token.getAddress(), ammount, { value: cost })
        await transaction.wait()
        return { factory, token, creator, buyer }
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
            const sales = await factory.getTokenSale(0)
            console.log(sales);
            expect(sales.token).to.equal(await token.getAddress())
            expect(sales.creator).to.equal(await creator.address)
            expect(sales.sold).to.equal(0)
            expect(sales.raised).to.equal(0)
            expect(sales.isOpen).to.equal(true)
        })
    })

    describe("Buying", function() {
        const ammount = ethers.parseUnits("10000", 18)
        const cost = ethers.parseUnits("1", 18)
        it("should update eth balance", async function() {
            const { factory } = await loadFixture(buyTokenFixture)
            const balance = await ethers.provider.getBalance(await factory.getAddress())
            expect(balance).to.equal(cost + fees)
        })

        it("should receive tokens", async function() {
            const { token, buyer } = await loadFixture(buyTokenFixture)
            const balance = await token.balanceOf(buyer.address)
            expect(balance).to.equal(ammount)
        })

        it("should update token sold", async function() {
            const { factory, token } = await loadFixture(buyTokenFixture)
            const sale = await factory.TokenToSale(await token.getAddress())
            expect(sale.sold).to.equal(ammount)
            expect(sale.raised).to.equal(cost)
            expect(sale.isOpen).to.equal(true)
        })
        it("should increase base cost", async function() {
            const { factory, token } = await loadFixture(buyTokenFixture)
            const sale = await factory.TokenToSale(await token.getAddress())
            const cost = await factory.getCost(sale.sold)
            expect(cost).to.be.equal(ethers.parseUnits("0.0002"))
        })

    })

    describe("Depositing", function() {
        const AMOUNT = ethers.parseUnits("10000", 18)
        const COST = ethers.parseUnits("2", 18)

        it("Sale should be closed and successfully deposits", async function() {
            const { factory, token, creator, buyer } = await loadFixture(buyTokenFixture)

            // Buy tokens again to reach target
            const buyTx = await factory.connect(buyer).buyTOken(await token.getAddress(), AMOUNT, { value: COST })
            await buyTx.wait()

            const sale = await factory.TokenToSale(await token.getAddress())
            expect(sale.isOpen).to.equal(false)

            const depositTx = await factory.connect(creator).deposit(await token.getAddress())
            await depositTx.wait()

            const balance = await token.balanceOf(creator.address)
            expect(balance).to.equal(ethers.parseUnits("980000", 18))
        })
    })
    describe("Withdrawing Fees", function() {
        it("Should update ETH balances", async function() {
            const { factory, deployer } = await loadFixture(factoryFixture)

            const transaction = await factory.connect(deployer).withdraw(fees)
            await transaction.wait()

            const balance = await ethers.provider.getBalance(await factory.getAddress())

            expect(balance).to.equal(0)
        })
    })
})