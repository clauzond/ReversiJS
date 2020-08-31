// Game parameters
const FPS = 30;
const HEIGHT = 700;
const WIDTH = 640;
const GRID_SIZE = 8; // number of rows and columns

const CELL = WIDTH / (GRID_SIZE + 2); // size of cell ; 1 cell blank on left and right
const STROKE = CELL / 10; // stroke width (stroke=contour)
const TILE_STROKE = CELL / 15;
const DOT = STROKE; // dot radius

const MARGIN = HEIGHT - (GRID_SIZE + 1) * CELL; // top margin, 1 cell free on top

const SCORE_X = WIDTH / 2;
const SCORE_Y = MARGIN - STROKE;
const PLAYERTURN_X = WIDTH / 2;
const PLAYERTURN_Y = STROKE * 1.5;

const PADDING = 20; // padding in style.css - #myCanvas

// Colors
const COLOR_BOARD = "#2C5F2D";
const COLOR_BORDER = "#a87139";
const COLOR_TILE = "#363636";
const COLOR_WHITE = "#eeeeee";
const COLOR_BLACK = "#222222";
const COLOR_TIE = "#aaaaaa";

// Game Canvas
var canv = document.getElementById("myCanvas");
canv.height = HEIGHT;
canv.width = WIDTH;
document.body.appendChild(canv);

// Other elements
// infoContainer = document.getElementById("infoContainer");

// Context
var ctx = canv.getContext("2d");

// Game variables
var playerTurn, diskList, moveList;
var NumberOfWhite = 0;
var NumberOfBlack = 0;
var HIGHLIGHT_HOVER = () => { return document.getElementById("highlightHover").checked };
var HIGHLIGHT_CAPTURED = () => { return document.getElementById("highlightCaptured").checked };
var HIGHLIGHT_POSSIBLE = () => { return document.getElementById("highlightPossible").checked };

// Event handlers
canv.addEventListener("mousemove", highlightGrid);
canv.addEventListener("click", mouseClick);
canv.addEventListener("mouseleave", clearHighlight);

function registerMove(row, col) {
    const alphabet = ["A", "B", "C", "D", "E", "F", "G", "H"];
    const moveName = alphabet[col]+""+row;
    moveList.push(moveName);
}

function highlightGrid(/** @type {MouseEvent} */ event) {
    if (!playerTurn) {
        return
    }

    var canvRect = canv.getBoundingClientRect(); // get mouse position relatively to the canvas
    // get mouse position relative to the canvas
    let x = event.clientX - canvRect.left - PADDING;
    let y = event.clientY - canvRect.top - PADDING;

    // highlight the possible disk and/or the captured disks
    if (HIGHLIGHT_HOVER() || HIGHLIGHT_CAPTURED() || HIGHLIGHT_POSSIBLE()) {
        // clear previous highlights
        clearHighlight();

        // calculate possible
        var row, col;
        var RowCol = getGridRowCol(x, y);
        if (RowCol) {
            [row, col] = RowCol;
            var disk = diskList[row][col];
            var capturedList = isTilePossible(disk);
            var bool = (capturedList.length != 0);
        } else {
            var disk = undefined;
            var bool = false;
            var capturedList = [];
        }
    }

    if (HIGHLIGHT_HOVER() && bool) {
        highlightHovered(disk);
    }
    if (HIGHLIGHT_CAPTURED() && bool) {
        highlightCaptured(capturedList);
    }
    if (HIGHLIGHT_POSSIBLE()) {
        highlightPossible();
    }


}

function clearHighlight() {
    for (let row of diskList) {
        for (let disk of row) {
            disk.highlight_state = false;
        }
    }
}

function highlightHovered(disk) {
    disk.highlight_state = true;
}

function highlightCaptured(capturedList) {
    for (let disk of capturedList) {
        disk.highlight_state = true;
    }
}

function highlightPossible() {
    var possibleList = [];
    for (let row of diskList) {
        for (let disk of row) {
            if (isTilePossible(disk).length != 0) {
                possibleList.push(disk);
            }
        }
    }
    for (let disk of possibleList) {
        disk.highlight_state = true;
    }
}

function mouseClick(/** @type {MouseEvent} */ event) {
    if (!playerTurn) {
        return
    }

    var canvRect = canv.getBoundingClientRect(); // get mouse position relatively to the canvas
    // get mouse position relative to the canvas
    let x = event.clientX - canvRect.left - PADDING;
    let y = event.clientY - canvRect.top - PADDING;

    var RowCol = getGridRowCol(x, y);
    if (RowCol) {
        [row, col] = RowCol;
        var disk = diskList[row][col];
        var capturedList = isTilePossible(disk);
        var bool = (capturedList != 0);
        if (bool) {
            disk.state = playerTurn;
            playTurn(capturedList, event);
            registerMove(row, col);
        }
    }
}

function nextTurn() {
    if (playerTurn == "white") {
        playerTurn = "black";
    } else {
        playerTurn = "white";
    };
}

function getGridX(col) {
    return (CELL * (col + 1)) // there is 1 free tile on the left
}

function getGridY(row) {
    return (MARGIN + CELL * row) // start after margin
}

function getGridRowCol(x, y) {
    // Col -> 1 free cell on the left
    // Row -> Margin on the top

    // Outside the board
    if (x < CELL || x >= (GRID_SIZE + 1) * CELL) {
        return (null);
    } else if (y < MARGIN || y >= (MARGIN + (GRID_SIZE * CELL))) {
        return (null);
    }

    // Inside the board
    var col = Math.floor((x - CELL) / CELL);
    var row = Math.floor((y - MARGIN) / CELL);


    return [row, col]
}

function drawBoard() {
    ctx.fillStyle = COLOR_BOARD;
    ctx.strokeStyle = COLOR_BORDER;
    ctx.lineWidth = STROKE;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeRect(STROKE / 2, STROKE / 2, WIDTH - STROKE, HEIGHT - STROKE);
}

function drawGrid() {
    for (let i = 0; i < GRID_SIZE; i++) { // row
        for (let j = 0; j < GRID_SIZE; j++) { // column
            drawTile(getGridX(j), getGridY(i));
        }
    }
}

function drawTile(x, y) {
    ctx.strokeStyle = COLOR_TILE;
    ctx.lineWidth = TILE_STROKE;
    ctx.strokeRect(x, y, CELL, CELL);
}

function drawDisks() {
    for (let row of diskList) {
        for (let disk of row) {
            disk.draw();
            disk.highlight();
        }
    }
}

function drawDisk(x, y, color, alpha = 1) {
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, (CELL / 2) * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
}

function drawText() {
    ctx.strokeStyle = getColor(playerTurn);
    ctx.font = "48px Garamond";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic"
    var score = "WHITE " + NumberOfWhite.toString() + " ¤ " + NumberOfBlack.toString() + " BLACK";
    ctx.strokeText(score, SCORE_X, SCORE_Y, WIDTH);

    ctx.fillStyle = getColor(playerTurn);
    ctx.font = "48px Garamond";
    ctx.textBaseline = "hanging";
    var turn = (playerTurn == "white" ? "White plays" : "Black plays");
    ctx.fillText(turn, PLAYERTURN_X, PLAYERTURN_Y, WIDTH);
}

function drawWinText(player, winCondition, playerTurn) {
    let screenText, infoText, winSentence;

    let x = playerTurn[0].toUpperCase() + playerTurn.substring(1);
    infoText = "Game ended. ";
    infoText += (winCondition == "boardFull" ? "The board is full. " : x+" cannot place any disk. ");

    if (player == "tie") {
        screenText = "IT'S A TIE !";
        infoText += "It's a tie.";
    } else {
        screenText = (player == "white" ? "WHITE WON !" : "BLACK WON !");
        infoText += (player == "white" ? "White won." : "Black won.")
    }
    overwriteGameInfo(infoText);

    drawBoard();
    drawGrid();
    drawDisks();
    playerTurn = null;
    ctx.strokeStyle = getColor(player);
    ctx.font = "48px Garamond";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic"
    var score = "WHITE " + NumberOfWhite.toString() + " ¤ " + NumberOfBlack.toString() + " BLACK";
    ctx.strokeText(score, SCORE_X, SCORE_Y, WIDTH);

    ctx.fillStyle = getColor(player);
    ctx.textAlign = "center";
    ctx.textBaseline = "hanging";
    ctx.fillText(screenText, PLAYERTURN_X, PLAYERTURN_Y, WIDTH);

}

function getColor(playerTurn) {
    switch (playerTurn) {
        case "white":
            return (COLOR_WHITE);
            break;
        case "black":
            return (COLOR_BLACK);
            break;
        case "tie":
            return (COLOR_TIE);
        default:
            return (false);
            break;
    }
}

// Tile object constructor
function Disk(row, col) {
    this.row = row;
    this.col = col;
    this.x = getGridX(col);
    this.y = getGridY(row);

    this.state = null;
    this.highlight_state = false;


    this.draw = () => {
        if (getColor(this.state) && playerTurn) {
            drawDisk(this.x + CELL / 2, this.y + CELL / 2, getColor(this.state));
        }
    }

    this.highlight = () => {
        var alpha = document.getElementById("alpha").value;
        if (this.highlight_state && playerTurn) {
            drawDisk(this.x + CELL / 2, this.y + CELL / 2, getColor(playerTurn), alpha);
        }
    }

}

// Game rules
function isTilePossible(disk) {
    if (disk.state != null) {
        return ([])
    }

    var capturedList = [];

    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (!((i == 0) && (j == 0))) {
                // add captured disks to capturedList
                capturedList = capturedList.concat(verifyTile_withDirection(disk, i, j))
            }
        }
    }
    return (capturedList)
}

function verifyTile_withDirection(disk, offset_row, offset_col) {
    let list = []; // disk list to add to capturedList
    let yourColor = (playerTurn == "white") ? "white" : "black";
    let otherColor = (playerTurn == "white") ? "black" : "white";
    let thisRow = disk.row + offset_row;
    let thisCol = disk.col + offset_col;

    // capture until blank or you-colored disk
    while ((0 <= thisRow) && (thisRow < GRID_SIZE) && (0 <= thisCol) && (thisCol < GRID_SIZE) && (diskList[thisRow][thisCol].state == otherColor)) {
        list.push(diskList[thisRow][thisCol]);
        thisRow += offset_row;
        thisCol += offset_col;
    }

    // if your disk is on the other side, you can capture
    if ((0 <= thisRow) && (thisRow < GRID_SIZE) && (0 <= thisCol) && (thisCol <= GRID_SIZE - 1) && (diskList[thisRow][thisCol].state == yourColor)) {
        return (list)
    } else {
        return ([])
    }

}

function playTurn(capturedList, event) {
    let p, sum=0;
    if (playerTurn == "white") {
        NumberOfWhite += 1;
        p = 1;
    } else {
        NumberOfBlack += 1;
        p = -1;
    }
    for (let disk of capturedList) {
        disk.state = playerTurn;
        NumberOfWhite += p;
        NumberOfBlack -= p;
        sum += 1;
    }

    let s = (sum==1 ? "" : "s");
    let ve = (sum==1 ? "s" : "ve");
    let sentence = sum+" disk"+s+" ha"+ve+" been captured."

    clearHighlight();
    nextTurn();
    highlightGrid(event);
    overwriteGameInfo(sentence);
    checkForWin(playerTurn);
}

function isThereAvailableTile() {
    for (let i = 0; i < GRID_SIZE; i++) {
        for (let j = 0; j < GRID_SIZE; j++) {
            if (isTilePossible(diskList[i][j]).length != 0) {
                return (true)
            }
        }
    }
    return (false)
}

function checkForWin(playerTurn) {
    let winCondition;
    if (NumberOfWhite + NumberOfBlack == GRID_SIZE ** 2) {
        winCondition = "boardFull";
    } else if (!isThereAvailableTile()) {
        winCondition = "noAvailableTile"
    } else {
        return
    }

    if (NumberOfBlack > NumberOfWhite) {
        stopGame();
        drawWinText(player="black", winCondition=winCondition, playerTurn=playerTurn)
    } else if (NumberOfWhite > NumberOfBlack) {
        stopGame();
        drawWinText(player="white", winCondition=winCondition, playerTurn=playerTurn)
    } else {
        stopGame();
        drawWinText(player="tie", winCondition=winCondition, playerTurn=playerTurn);
    }

}

function overwriteGameInfo(text) {
    infoContainer.innerHTML = text;
}

function newGame() {
    playerTurn = "black";
    diskList = [];
    moveList = [];
    for (let i = 0; i < GRID_SIZE; i++) { // row
        diskList[i] = []
        for (let j = 0; j < GRID_SIZE; j++) { // column
            diskList[i][j] = new Disk(i, j);
        }
    }

    m = Math.floor(GRID_SIZE / 2) - 1;

    diskList[m][m].state = "white";
    diskList[m + 1][m + 1].state = "white";
    diskList[m][m + 1].state = "black";
    diskList[m + 1][m].state = "black";

    NumberOfBlack = 2;
    NumberOfWhite = 2;

}

function stopGame() {
    clearInterval(runningLoop);
}

function resetGame() {
    stopGame();
    startLoop();
    newGame();
    overwriteGameInfo("Game has reset.");
}

// Start a new game
newGame();

// Set up the game loop
function startLoop() {
    runningLoop = setInterval(loop, 1000 / FPS);
}

var runningLoop;
startLoop();


function loop() {
    drawBoard(); // draw background
    drawGrid(); // draw grid, with each individual tile
    drawDisks(); // draw the active disk
    drawText(); // draw the top hud
    // 2 mouse events : click (-> place a disk) and mousemove (-> highlight if possible)
}