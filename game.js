// Game parameters
const FPS = 30;
const HEIGHT = 700;
const WIDTH = 640;
const GRID_SIZE = 8; // number of rows and columns

const CELL = WIDTH / (GRID_SIZE + 2); // size of cell ; 1 cell blank on left and right
const STROKE = CELL / 5; // stroke width (stroke=contour)
const TILE_STROKE = CELL / 15;
const DOT = STROKE; // dot radius

const MARGIN = HEIGHT - (GRID_SIZE + 1) * CELL; // top margin, 1 cell free on top

const SCORE_X = WIDTH / 2;
const SCORE_Y = MARGIN - STROKE;
const PLAYERTURN_X = WIDTH / 2;
const PLAYERTURN_Y = STROKE * 1.5;

// Colors
const COLOR_BOARD = "#00AB1A";
const COLOR_BORDER = "#2FC99A";
const COLOR_TILE = "#363636";
const COLOR_WHITE = "#eeeeee";
const COLOR_BLACK = "#222222";
const COLOR_TIE = "#aaaaaa";


// Game Canvas
var canv = document.createElement("canvas");
canv.height = HEIGHT;
canv.width = WIDTH;
document.body.appendChild(canv);
var canvRect = canv.getBoundingClientRect(); // get mouse position relatively to the canvas

// Context
var ctx = canv.getContext("2d");

// Game variables
var playerTurn, diskList, dicPossible;
var NumberOfWhite = 0;
var NumberOfBlack = 0;

// Event handlers
canv.addEventListener("mousemove", highlightGrid);
canv.addEventListener("click", mouseClick)

function highlightGrid(/** @type {MouseEvent} */ event) {
    if (!playerTurn) {
        return
    }

    // get mouse position relative to the canvas
    let x = event.clientX - canvRect.left;
    let y = event.clientY - canvRect.top;

    // highlight the current selected square
    clearHighlight();
    highlightHoveredDisk(x, y);

}

function clearHighlight() {
    for (let row of diskList) {
        for (let disk of row) {
            disk.highlight_state = false
        }
    }
}

function highlightHoveredDisk(x, y) {
    var row, col;
    var RowCol = getGridRowCol(x, y);
    if (RowCol) {
        [row, col] = RowCol;
        var disk = diskList[row][col]
        if (isTilePossible(disk)) {
            disk.highlight_state = true
        }
    }
}

function mouseClick(/** @type {MouseEvent} */ event) {
    if (!playerTurn) {
        return
    }
    // get mouse position relative to the canvas
    let x = event.clientX - canvRect.left;
    let y = event.clientY - canvRect.top;

    var RowCol = getGridRowCol(x, y);
    if (RowCol) {
        [row, col] = RowCol;
        var disk = diskList[row][col];
        if (isTilePossible(disk)) {
            disk.state = playerTurn;
            playTurn();
            nextTurn();
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

function drawWinText(player) {
    var txt;
    if (player == "tie") {
        txt = "IT'S A TIE !"
    } else {
        txt = (player == "white" ? "WHITE WON !" : "BLACK WON !");
    }

    drawBoard();
    drawGrid();
    drawDisks();
    playerTurn = null;
    ctx.strokeStyle = getColor(player);
    ctx.font = "48px Garamond";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic"
    var score = "WHITE " + NumberOfWhite.toString() + " | " + NumberOfBlack.toString() + " BLACK";
    ctx.strokeText(score, SCORE_X, SCORE_Y, WIDTH);

    ctx.fillStyle = getColor(player);
    ctx.textAlign = "center";
    ctx.textBaseline = "hanging";
    ctx.fillText(txt, PLAYERTURN_X, PLAYERTURN_Y, WIDTH);
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
        if (this.highlight_state && playerTurn) {
            drawDisk(this.x + CELL / 2, this.y + CELL / 2, getColor(playerTurn), 0.3);
        }
    }

}

// Game rules
function isTilePossible(disk) {
    if (disk.state != null)
    {
        return(false)
    }
    dicPossible = { 'row': disk.row, 'col': disk.col, 'list': [] }; // reset dicPossible
    for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
            if (!((i == 0) && (j == 0))) {
                verifyTile_withDirection(disk, i, j) // add possible disks in dicPossible['list']
            }
        }
    }
    return (dicPossible['list'].length != 0)
}

function verifyTile_withDirection(disk, offset_row, offset_col) {
    let list = []; // disk list to add to dicPossible['list'] at the end
    let yourColor = (playerTurn == "white") ? "white" : "black";
    let otherColor = (playerTurn == "white") ? "black" : "white";
    let thisRow = disk.row + offset_row;
    let thisCol = disk.col + offset_col;

    while ((0 <= thisRow) && (thisRow < GRID_SIZE) && (0 <= thisCol) && (thisCol < GRID_SIZE) && (diskList[thisRow][thisCol].state == otherColor)) { // go until blank or you-colored disk
        list.push(diskList[thisRow][thisCol]);
        thisRow += offset_row;
        thisCol += offset_col;
    }


    if ((0 <= thisRow) && (thisRow < GRID_SIZE) && (0 <= thisCol) && (thisCol <= GRID_SIZE - 1) && (diskList[thisRow][thisCol].state == yourColor)) { // if your disk is on the other side
        for (let k = 0; k < list.length; k++) {
            dicPossible['list'].push(list[k]);
        }
    }

}

function playTurn() {
    var d;
    if (playerTurn == "white") {
        NumberOfWhite += 1;
        d = 1;
    } else {
        NumberOfBlack += 1;
        d = -1;
    }
    for (let disk of dicPossible['list']) {
        disk.state = playerTurn;
        NumberOfWhite += d;
        NumberOfBlack -= d;
    }

    clearHighlight();
    dicPossible = { 'row': null, 'col': null, 'list': [] }; // reset dicPossible
}

function isThereAvailableTile() {
    for (let i=0; i<GRID_SIZE; i++) {
        for (let j=0; j<GRID_SIZE; j++) {
            if (isTilePossible(diskList[i][j])) {
                dicPossible = { 'row': null, 'col': null, 'list': [] }
                return(true)
            }
        }
    }
    dicPossible = { 'row': null, 'col': null, 'list': [] }
    return(false)
}

function checkForWin() {
    if ((NumberOfWhite + NumberOfBlack == GRID_SIZE ** 2)||(!isThereAvailableTile())) {
        if (NumberOfBlack > NumberOfWhite) {
            stopGame();
            drawWinText("black");
        } else if (NumberOfWhite > NumberOfBlack) {
            stopGame();
            drawWinText("white")
        } else {
            stopGame();
            drawWinText("tie");
        }
    }
}

function newGame() {
    playerTurn = "black";
    diskList = [];
    dicPossible = { 'row': null, 'col': null, 'list': [] };
    for (let i = 0; i < GRID_SIZE; i++) { // row
        diskList[i] = []
        for (let j = 0; j < GRID_SIZE; j++) { // column
            diskList[i][j] = new Disk(i, j);
        }
    }

    m = Math.floor(GRID_SIZE/2)-1;

    diskList[m][m].state = "white";
    diskList[m+1][m+1].state = "white";
    diskList[m][m+1].state = "black";
    diskList[m+1][m].state = "black";

    NumberOfBlack = 2;
    NumberOfWhite = 2;

}

function stopGame() {
    clearInterval(runningLoop);
}

// Start a new game
newGame();

// Set up the game loop
var runningLoop = setInterval(loop, 1000 / FPS);

function loop() {
    drawBoard(); // draw background
    drawGrid(); // draw grid, with each individual tile
    drawDisks(); // draw the active disk
    drawText(); // draw the top hud
    // 2 mouse events : click (-> place a disk) and mousemove (-> highlight if possible)
    checkForWin();
}