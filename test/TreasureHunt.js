const { expect } = require("chai");
const { ethers } = require("hardhat");
describe("TreasureHunt Contract", function () {
    let TreasureHunt, treasureHunt;
    let owner, addr1, addr2;
  
    beforeEach(async function () {
      TreasureHunt = await ethers.getContractFactory("TreasureHunt");
      [owner, addr1, addr2] = await ethers.getSigners();
      treasureHunt = await TreasureHunt.deploy();
    //   await treasureHunt.deployed();
    });
  
    describe("Deployment", function () {
      it("Should set the initial treasure position correctly", async function () {
        const initialPosition = await treasureHunt.treasurePosition();
        expect(initialPosition).to.be.within(0, 99);
      });
    });

  describe("Join Game", function () {
    it("Should allow a player to join the game by sending ETH", async function () {
      await treasureHunt.connect(addr1).joinGame({ value: ethers.parseEther("0.1")   });

      const playerInfo = await treasureHunt.players(addr1.address);
      expect(playerInfo.position).to.be.within(0, 99);
      expect(playerInfo.hasMoved).to.be.false;
    });

    it("Should not allow a player to join the game without ETH", async function () {
      await expect(treasureHunt.connect(addr1).joinGame({ value: 0 })).to.be.revertedWith(
        "Must send some ETH to join the game"
      );
    });

    it("Should not allow a player to join more than once", async function () {
      await treasureHunt.connect(addr1).joinGame({ value: ethers.parseEther("0.1")   });
      await expect(treasureHunt.connect(addr1).joinGame({ value: ethers.parseEther("0.1")   })).to.be.revertedWith(
        "Player already joined"
      );
    });
  });

  describe("Player Move", function () {
    beforeEach(async function () {
      await treasureHunt.connect(addr1).joinGame({ value: ethers.parseEther("0.1")   });
    });

    it("Should allow a player to move to an adjacent cell", async function () {
      const playerInfo = await treasureHunt.players(addr1.address);
      const initialPositionBN = playerInfo.position;
      const initialPosition = Number(initialPositionBN); // Convert to number for easier manipulation
  
      let newPosition = (initialPosition + 1) % 100;
      if (newPosition === initialPosition) newPosition = (initialPosition + 1) % 100;
  
      await treasureHunt.connect(addr1).move(newPosition);
      const updatedPlayerInfo = await treasureHunt.players(addr1.address);
  
      expect(Number(updatedPlayerInfo.position)).to.equal(newPosition);
      expect(updatedPlayerInfo.hasMoved).to.be.true;
    });

    it("Should not allow a player to move to a non-adjacent cell", async function () {
      const playerInfo = await treasureHunt.players(addr1.address);
      const initialPosition = Number(playerInfo.position);
      const invalidPosition = (initialPosition + 10) % 100; // Move more than one cell away
      await expect(treasureHunt.connect(addr1).move(invalidPosition)).to.be.revertedWith(
        "Move must be to an adjacent cell"
      );
    });

    it("Should not allow a player to move more than once per turn", async function () {
      const playerInfo = await treasureHunt.players(addr1.address);
      const initialPosition =Number( playerInfo.position);

      let newPosition = (initialPosition + 1) % 100;
      if (newPosition === initialPosition) newPosition = (initialPosition + 1) % 100;

      await treasureHunt.connect(addr1).move(newPosition);
      await expect(treasureHunt.connect(addr1).move(newPosition)).to.be.revertedWith("Player has already moved this turn");
    });

    it("Should handle edge cases for grid boundaries", async function () {
      await treasureHunt.connect(addr1).joinGame({ value: ethers.parseEther("0.1")   });

      const edgePositions = [0, 9, 90, 99]; // Corners of the grid
      for (let pos of edgePositions) {
        const adjacentPositions = [
          pos - 1, pos + 1, pos - GRID_SIZE, pos + GRID_SIZE
        ].filter(p => p >= 0 && p < 100);
        
        for (let newPos of adjacentPositions) {
          await treasureHunt.connect(addr1).move(newPos);
          const playerInfo = await treasureHunt.players(addr1.address);
          expect(playerInfo.position).to.equal(newPos);
          expect(playerInfo.hasMoved).to.be.true;
        }
      }
    });
  });

  describe("Treasure Movement Rules", function () {
    beforeEach(async function () {
      await treasureHunt.connect(addr1).joinGame({ value: ethers.parseEther("0.1")   });
    });

    it("Should move treasure to a random adjacent cell when player moves to a multiple of 5", async function () {
      const playerInfo = await treasureHunt.players(addr1.address);
      const newPosition = 5; // Multiples of 5

      await treasureHunt.connect(addr1).move(newPosition);
      const updatedTreasurePosition = await treasureHunt.treasurePosition();

      expect(updatedTreasurePosition).to.be.within(0, 99);
      expect(updatedTreasurePosition).to.not.equal(newPosition); 
    });

    it("Should move treasure to a random position when player moves to a prime number", async function () {
      const playerInfo = await treasureHunt.players(addr1.address);
      const newPosition = 7; // Prime number

      await treasureHunt.connect(addr1).move(newPosition);
      const updatedTreasurePosition = await treasureHunt.treasurePosition();

      expect(updatedTreasurePosition).to.be.within(0, 99);
      expect(updatedTreasurePosition).to.not.equal(newPosition); 
    });

    it("Should handle multiple conditions for treasure movement", async function () {
      const playerInfo = await treasureHunt.players(addr1.address);
      const newPosition = 5; 

      await treasureHunt.connect(addr1).move(newPosition);
      const treasureAfterFirstMove = await treasureHunt.treasurePosition();
      const primePosition = 7;
      await treasureHunt.connect(addr1).move(primePosition);
      const treasureAfterSecondMove = await treasureHunt.treasurePosition();

      expect(treasureAfterFirstMove).to.not.equal(treasureAfterSecondMove); 
    });
  });

  describe("Winning the Game", function () {
    beforeEach(async function () {
      await treasureHunt.connect(addr1).joinGame({ value: ethers.parseEther("0.1")   });
    });

    it("Should declare a winner and distribute the reward", async function () {
      const initialPosition = await treasureHunt.treasurePosition();
      await treasureHunt.connect(addr1).move(initialPosition); 

      const winner = await treasureHunt.winner();
      expect(winner).to.equal(addr1.address);

      const balanceAfterWin = await ethers.provider.getBalance(addr1.address);
      expect(balanceAfterWin).to.be.gt(ethers.parseEther("0.1")  ); 
    });
  });

  describe("Reset Game", function () {
    it("Should reset the game for a new round after a win", async function () {
      await treasureHunt.connect(addr1).joinGame({ value: ethers.parseEther("0.1")   });
      const initialPosition = await treasureHunt.treasurePosition();
      await treasureHunt.connect(addr1).move(initialPosition); // Move to treasure position

      const newTreasurePosition = await treasureHunt.treasurePosition();
      expect(newTreasurePosition).to.be.within(0, 99);
      expect(newTreasurePosition).to.not.equal(initialPosition); 

      const playerInfo = await treasureHunt.players(addr1.address);
      expect(playerInfo.position).to.equal(0); 
      expect(playerInfo.hasMoved).to.be.false; 
    });

    it("Should clean up player data after a win", async function () {
      await treasureHunt.connect(addr1).joinGame({ value: ethers.parseEther("0.1")   });
      const initialPosition = await treasureHunt.treasurePosition();
      await treasureHunt.connect(addr1).move(initialPosition); 

      const playerInfo = await treasureHunt.players(addr1.address);
      expect(playerInfo.position).to.equal(0); 
      expect(playerInfo.hasMoved).to.be.false; 
    });
  });
});
