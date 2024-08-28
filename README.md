TreasureHunt Contract
Overview
The TreasureHunt smart contract is a decentralized game deployed on the Ethereum blockchain where players can join a game, move on a grid, and attempt to find hidden treasure. The game includes features such as player movement, treasure movement rules based on game mechanics, and the ability to declare a winner and reset the game for a new round.

Features
Player Interaction: Players can join the game by sending ETH and move to different positions on a 10x10 grid.
Treasure Movement: The treasure moves based on player actions and specific game rules.
Winning Conditions: The game detects when a player finds the treasure and distributes the reward.
Game Reset: The game resets after a win, allowing for new rounds.


The TreasureHunt smart contract includes the following key components:

Player Management: Players are tracked with their positions and movement status.
Treasure Management: The treasure is initially placed at a random position and moves based on player actions.
Randomness Handling
Randomness in this contract is handled through simple pseudo-random mechanisms, which are limited by the deterministic nature of blockchain environments. The contract uses the current block timestamp and the sender's address to generate pseudo-random values, which are not fully secure for high-stakes randomness but are acceptable for this game's purpose.
Design Choices and Randomness Handling
Design Choices
Grid-Based Game Mechanics: The game operates on a 10x10 grid (100 cells) where players can move and attempt to find the hidden treasure. This grid structure ensures a manageable and straightforward game environment.

Player and Treasure Management:

Player Management: Each player is tracked with their current position on the grid and their movement status (whether they have moved during the current turn).
Treasure Management: The treasure starts at a random position and can move based on specific game rules.
Movement Rules:

Players can only move to adjacent cells to ensure that the game remains engaging and requires strategic movement.
Players are restricted to moving only once per turn to prevent rapid position changes and maintain fairness.
Winning Conditions: The game detects when a player moves to the treasure’s position, declares the player as the winner, and distributes the reward.

Game Reset: After a win, the game resets to allow new rounds, with player data cleaned up to start fresh.

Randomness Handling
Randomness in the TreasureHunt contract is implemented using pseudo-random mechanisms due to the deterministic nature of blockchain environments:

Initial Treasure Position:

The initial position of the treasure is determined using the current block timestamp. This approach provides a reasonably random starting point but is not cryptographically secure.
Treasure Movement:

Multiples of 5: When a player moves to a position that is a multiple of 5, the treasure is moved to a random adjacent cell. This movement is controlled using a combination of block variables and player actions.
Prime Numbers: When a player moves to a prime-numbered position, the treasure is moved to a random new position on the grid.
Due to the limitations of on-chain randomness, this contract’s approach to randomness provides fairness within the constraints of Ethereum’s deterministic environment. For more secure randomness, integration with Chainlink VRF or similar oracle services could be considered.

This design ensures that the game is both functional and engaging while acknowledging the constraints and trade-offs associated with on-chain randomness.
