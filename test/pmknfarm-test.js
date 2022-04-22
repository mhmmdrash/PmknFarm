const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PmknFarm", () => {
    let owner
    let alice
    let bob
    let pmknFarm
    let pmknToken
    let mockDai
    const daiAmount = ethers.utils.parseEther("100000");

    beforeEach(async() => {
        const PmknFarm = await ethers.getContractFactory("PmknFarm");
        const PmknToken = await ethers.getContractFactory("PmknToken");
        const MockDai = await ethers.getContractFactory("DaiToken");
        mockDai = await MockDai.deploy();
        [owner, alice, bob] = await ethers.getSigners();
        await Promise.all([
            mockDai.mint(owner.address, daiAmount),
            mockDai.mint(alice.address, daiAmount),
            mockDai.mint(bob.address, daiAmount)
        ]);
        pmknToken = await PmknToken.deploy();
        pmknFarm = await PmknFarm.deploy(mockDai.address, pmknToken.address);
    });

    describe("Init", () => {
        it("should be deployed succesfully", async() => {
            expect( pmknFarm).to.be.ok;
            expect( pmknToken).to.be.ok;
            expect( mockDai).to.be.ok;
        })
    })

    describe("stake", () => {
        it("should stake dai", async() => {
            let toTransfer = ethers.utils.parseEther("100");
            await mockDai.connect(alice).approve(pmknFarm.address, toTransfer);
            expect( await pmknFarm.isStaking(alice.address)).to.eq(false)
            expect( await pmknFarm.connect(alice).stake(toTransfer)).to.be.ok
            expect( await pmknFarm.isStaking(alice.address)).to.eq(true)
        });

        it("multiple accounts should stake", async() => {
            let toTransfer = ethers.utils.parseEther("100");
            await mockDai.connect(alice).approve(pmknFarm.address, toTransfer);
            await mockDai.connect(bob).approve(pmknFarm.address, toTransfer);
            expect( await pmknFarm.isStaking(alice.address)).to.eq(false)
            expect( await pmknFarm.isStaking(bob.address)).to.eq(false)
            expect( await pmknFarm.connect(alice).stake(toTransfer)).to.be.ok
            expect( await pmknFarm.connect(bob).stake(toTransfer)).to.be.ok
            expect( await pmknFarm.isStaking(alice.address)).to.eq(true)
            expect( await pmknFarm.isStaking(bob.address)).to.eq(true)
            expect( await pmknFarm.stakingBalance(alice.address)).to.eq(toTransfer)
            expect( await pmknFarm.stakingBalance(bob.address)).to.eq(toTransfer)
        })

        it("one account should stake multiple times", async() => {
            let transfer = ethers.utils.parseEther("1000");
            await mockDai.connect(alice).approve(pmknFarm.address, transfer)
            expect( await pmknFarm.isStaking(alice.address)).to.eq(false)
            expect( await pmknFarm.stakingBalance(alice.address)).to.eq(0)
            
            expect( await pmknFarm.connect(alice).stake(transfer)).to.be.ok
            expect( await pmknFarm.stakingBalance(alice.address)).to.eq(transfer)

            await mockDai.connect(alice).approve(pmknFarm.address, transfer)

            expect( await pmknFarm.connect(alice).stake(transfer)).to.be.ok
            expect( await pmknFarm.stakingBalance(alice.address)).to.eq("2000000000000000000000")
        })

        it("should revert with not enough funds", async() => {
            let toTransfer = ethers.utils.parseEther("1000000")
            await mockDai.approve(pmknFarm.address, toTransfer)

            await expect(pmknFarm.connect(bob).stake(toTransfer))
                .to.be.revertedWith("Cannot stake zero tokens")
        })
    })

    describe("unstake", () => {
        it("should unstake from acount", async() => {
            let toTransfer = ethers.utils.parseEther("100")
            expect( await mockDai.connect(alice).approve(pmknFarm.address, toTransfer)).to.be.ok

            expect( await pmknFarm.isStaking(alice.address)).to.eq(false)
            //stake 
            expect( await pmknFarm.connect(alice).stake(toTransfer)).to.be.ok
            expect( await pmknFarm.stakingBalance(alice.address)).to.eq(toTransfer)
            expect( await pmknFarm.isStaking(alice.address)).to.eq(true)
            //unstake
            expect( await pmknFarm.connect(alice).unstake(toTransfer)).to.be.ok
            expect( await pmknFarm.isStaking(alice.address)).to.eq(false)
            expect( await pmknFarm.stakingBalance(alice.address)).to.eq("0")
        })
    })

    describe("withdraw", () => {
        beforeEach(async() => {
            await pmknToken.transferOwnership(pmknFarm.address)
            let toTransfer = ethers.utils.parseEther("10")
            await mockDai.connect(alice).approve(pmknFarm.address, toTransfer)
            await pmknFarm.connect(alice).stake(toTransfer)
        })

        it("should withdraw", async() => {
            let toTransfer = ethers.utils.parseEther("10")

            expect( await pmknFarm.isStaking(alice.address)).to.eq(true)
            expect( await pmknFarm.stakingBalance(alice.address)).to.eq(toTransfer)

            let blockNumBefore = await ethers.provider.getBlockNumber();
            let blockBefore = await ethers.provider.getBlock(blockNumBefore);
            let timestampBefore = blockBefore.timestamp;

            await network.provider.send("evm_mine", [timestampBefore + 86400]); 
            expect( await pmknFarm.calculateYieldTime(alice.address)).to.eq(86400)

            let yield = await pmknFarm.calculateYieldTotal(alice.address);
            let fyield = ethers.utils.formatEther(yield);
            let eyield = Number.parseFloat(fyield).toFixed(3).toString()

            expect( await pmknFarm.connect(alice).withdrawYield()).to.be.ok

            res = await pmknToken.balanceOf(alice.address)
            newRes = ethers.utils.formatEther(res)
            formatRes = Number.parseFloat(newRes).toFixed(3).toString()

            expect(eyield).to.eq(formatRes)
        })
    })




})