// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TreasureHunt {
    uint8 constant GRID_SIZE = 10; 
    uint8 constant TOTAL_CELLS = GRID_SIZE * GRID_SIZE; 
    
    uint256 public treasurePosition;
    address public winner;
    uint256 public gameStartBlock;
    uint256 public totalPlayers;

    struct Player {
        uint8 position; 
        bool hasMoved;
    }

    mapping(address => Player) public players;
    address[] public playerList;

    // Events
    event PlayerMoved(address indexed player, uint8 newPosition);
    event TreasureMoved(uint8 newPosition);
    event GameWon(address indexed winner, uint256 reward);

    constructor() {
        gameStartBlock = block.number;
        treasurePosition = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - 1)))) % TOTAL_CELLS);
    }

    function joinGame() external payable {
        require(msg.value > 0, "Must send some ETH to join the game");
        require(players[msg.sender].position == 0 && !players[msg.sender].hasMoved, "Player already joined");
        players[msg.sender] = Player({
            position: uint8(uint256(keccak256(abi.encodePacked(msg.sender, block.timestamp))) % TOTAL_CELLS),
            hasMoved: false
        });
        playerList.push(msg.sender);
        totalPlayers++;
    }

    function move(uint8 newPosition) external {
        Player storage player = players[msg.sender];
        require(player.position < TOTAL_CELLS, "Player not in the game");
        require(newPosition < TOTAL_CELLS, "Invalid grid position");
        require(isAdjacent(player.position, newPosition), "Move must be to an adjacent cell");
        require(!player.hasMoved, "Player has already moved this turn");

        player.position = newPosition;
        player.hasMoved = true;
        emit PlayerMoved(msg.sender, newPosition);
        if (newPosition == treasurePosition) {
            declareWinner(msg.sender);
            return;
        }
        moveTreasure(newPosition);
        emit TreasureMoved(uint8(treasurePosition));
    }

    function isAdjacent(uint8 from, uint8 to) internal pure returns (bool) {
        uint8 fromX = from % GRID_SIZE;
        uint8 fromY = from / GRID_SIZE;
        uint8 toX = to % GRID_SIZE;
        uint8 toY = to / GRID_SIZE;

        return (fromX == toX && (fromY == toY + 1 || fromY == toY - 1)) || // Same column, adjacent row
               (fromY == toY && (fromX == toX + 1 || fromX == toX - 1));  // Same row, adjacent column
    }

function moveTreasure(uint8 playerPosition) internal {
    if (playerPosition % 5 == 0) {
        treasurePosition = uint256(randomAdjacentPosition(uint8(treasurePosition)));
    } else if (isPrime(playerPosition)) {
        treasurePosition = uint256(uint256(keccak256(abi.encodePacked(block.timestamp, block.chainid))) % TOTAL_CELLS);
    }
}

function randomAdjacentPosition(uint8 position) internal view returns (uint8) {
    uint8[] memory adjacentPositions = new uint8[](4);
    uint8 index = 0;

    uint8 x = position % GRID_SIZE;
    uint8 y = position / GRID_SIZE;
    if (x > 0) adjacentPositions[index++] = position - 1; // Left
    if (x < GRID_SIZE - 1) adjacentPositions[index++] = position + 1; // Right
    if (y > 0) adjacentPositions[index++] = position - GRID_SIZE; // Up
    if (y < GRID_SIZE - 1) adjacentPositions[index++] = position + GRID_SIZE; // Down
    uint256 randomHash = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
    uint8 randomIndex = uint8(randomHash % index);
    return adjacentPositions[randomIndex];
}
    function isPrime(uint8 num) internal pure returns (bool) {
        if (num <= 1) return false;
        for (uint8 i = 2; i * i <= num; i++) {
            if (num % i == 0) return false;
        }
        return true;
    }

    // Function to declare the winner and distribute rewards
    function declareWinner(address _winner) internal {
        winner = _winner;
        uint256 reward =(address(this).balance * 90) / 100; 

        (bool sent, ) = winner.call{value: reward}("");
        require(sent, "Failed to send Ether to winner");
        emit GameWon(winner, reward);
        resetGame();
    }

    // Function to reset the game for a new round
    function resetGame() internal {
        treasurePosition = uint8(uint256(keccak256(abi.encodePacked(block.timestamp, block.prevrandao))) % TOTAL_CELLS);
        for (uint256 i = 0; i < playerList.length; i++) {
            delete players[playerList[i]];
        }
        delete playerList;
        totalPlayers = 0;
    }

    // Function to withdraw remaining contract balance (only in case of emergency)
    function withdrawContractBalance() external {
        require(msg.sender == winner, "Only the winner can withdraw the remaining balance");
        uint256 remainingBalance = address(this).balance;
        (bool sent, ) = msg.sender.call{value: remainingBalance}("");
        require(sent, "Failed to send remaining balance to winner");
    }
}
