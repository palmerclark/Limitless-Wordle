// Constants & Game State
const WORD_LENGTH = 5;
const ROWS = 6;

let divs; // tiles
let colors = Array(WORD_LENGTH).fill("rgb(170,170,170)");
let count;

const game = {
  solution: "",
  currentTile: 0,
  endOfRow: WORD_LENGTH,
  attempts: 0,
  allowInputs: true,
  gameOver: false,
};

//DOM Generation (Board & Keyboard)
function generateBoard() {
  const table = document.getElementById("table");

  for (let i = 0; i < WORD_LENGTH * ROWS; i++) {
    const tile = document.createElement("div");
    tile.classList.add("tile");
    table.appendChild(tile);
  }
  divs = document.querySelectorAll("div.tile");
}

function generateKeyBoard() {
  const keys = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "Backspace"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Enter"],
    ["Z", "X", "C", "V", "B", "N", "M"],
  ];
  const keyboard = document.getElementById("keyboard");
  keys.forEach((keyboardRow) => {
    const row = document.createElement("div");
    row.classList.add("keyboard-row");
    keyboardRow.forEach((character) => {
      const button = document.createElement("button");
      button.textContent = character;
      button.classList.add("key");
      row.appendChild(button);
    });
    keyboard.appendChild(row);
  });
}

async function startGame() {
  await fetchWord();
  generateBoard();
  generateKeyBoard();
  game.allowInputs = true;
}

startGame();

async function fetchWord() {
  try {
    const response = await fetch("http://localhost:3000/random-word");
    const data = await response.json();

    game.solution = data.word;
  } catch (err) {
    console.error("Failed to fetch word:", err);
  }
}

//Input Handling
addEventListener("keydown", gatherTypedInputs);
addEventListener("click", gatherButtonInputs);

function gatherTypedInputs(e) {
  const input = e.key.toUpperCase();
  printInputs(input);
}

function gatherButtonInputs(e) {
  const target = e.target;
  let text = "";
  if (target.tagName == "BUTTON") {
    text = target.textContent;
  }
  printInputs(text);
}

//UI Feedback & Animations
function triggerShake(e) {
  function onAnimationEnd() {
    e.classList.remove("shake");
    e.removeEventListener("animationend", onAnimationEnd);
  }

  e.classList.add("shake");
  e.addEventListener("animationend", onAnimationEnd);
}

function displayMessage(message) {
  let alertDiv = document.getElementById("alert");
  alertDiv.textContent = message;
  alertDiv.style.visibility = "visible";
  setTimeout(() => {
    alertDiv.style.visibility = "hidden";
  }, 1500);
}

//Game Logic
function printInputs(input) {
  if (!game.allowInputs) {
    return;
  } else if (game.currentTile == game.endOfRow && input == "ENTER") {
    let guess = "";
    for (let i = game.currentTile - WORD_LENGTH; i < game.currentTile; i++) {
      guess += divs[i].textContent;
    }
    compareToSolution(guess);
    game.endOfRow += WORD_LENGTH;
    game.attempts++;
  } else if (game.currentTile != game.endOfRow && input == "ENTER") {
    for (
      let i = game.currentTile - (game.currentTile % WORD_LENGTH);
      i < game.currentTile;
      i++
    ) {
      triggerShake(divs[i]);
    }
    displayMessage("Not enough letters!");
  } else if (
    game.currentTile != game.endOfRow &&
    input.match(/^[A-Z]$/) &&
    game.currentTile < divs.length &&
    game.allowInputs == true
  ) {
    divs[game.currentTile].textContent = input;
    game.currentTile++;
  }
  if (input == "BACKSPACE" && game.currentTile > game.endOfRow - WORD_LENGTH) {
    game.currentTile--;
    divs[game.currentTile].textContent = "";
  }
}

function compareToSolution(guess) {
  count = 0;
  let greens = Array(WORD_LENGTH);
  let yellows = Array(WORD_LENGTH);

  for (let i = 0; i < guess.length; i++) {
    if (guess[i] == game.solution[i]) {
      greens[i] = guess[i];
      colors[i] = "rgb(83, 141, 78)";
      count++;
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (
      game.solution.indexOf(guess[i]) >= 0 &&
      greens.indexOf(guess[i]) < 0 &&
      yellows.indexOf(guess[i]) < 0
    ) {
      colors[i] = "rgb(181, 159, 59)";
      yellows[i] = guess[i];
    } else if (game.solution.indexOf(guess[i]) < 0) {
      colors[i] = "rgb(170, 170, 170)";
    }
  }

  game.allowInputs = false;
  for (let i = 0; i < guess.length; i++) {
    let tile = divs[game.currentTile - WORD_LENGTH + i];
    setTimeout(() => {
      tile.classList.add("flip");
      setTimeout(() => {
        tile.style.backgroundColor = colors[i];
      }, 500);
    }, i * 500 + 100);
  }

  setTimeout(() => {
    updateKeyboard(guess);

    if (count == WORD_LENGTH) {
      endGame("You win!");
      return;
    } else if (game.attempts == 6) {
      endGame("Awh :( Better luck next time!");
      return;
    }
    game.allowInputs = true;
  }, guess.length * 500 + 100);
}

function updateKeyboard(guess) {
  const buttons = document.getElementsByClassName("key");

  for (let i = 0; i < WORD_LENGTH; i++) {
    const letter = guess[i];
    const color = colors[i];

    for (let j = 0; j < buttons.length; j++) {
      if (buttons[j].textContent == letter) {
        const currentColor = buttons[j].style.backgroundColor;

        if (currentColor == "") {
          buttons[j].style.backgroundColor = color;
        } else if (color == "rgb(83, 141, 78)") {
          // green
          buttons[j].style.backgroundColor = color;
        } else if (
          color == "rgb(181, 159, 59)" &&
          currentColor == "rgb(170, 170, 170)"
        ) {
          buttons[j].style.backgroundColor = color;
        }
      }
    }
  }
}

function endGame(message) {
  game.gameOver = true;
  game.allowInputs = false;

  setTimeout(() => {
    const summary = document.getElementById("summary");
    summary.style.visibility = "visible";
  }, 1500);

  displayMessage(message);
}

// 7. Game Reset / Replay
document.getElementById("next_game").addEventListener("click", resetGame);

function resetGame(e) {
  if (e.target.id == "next_game") {
    console.log(e);
    document.getElementById("table").innerHTML = "";
    generateBoard();
    document.getElementById("keyboard").innerHTML = "";
    generateKeyBoard();
    document.getElementById("summary").style.visibility = "hidden";
    fetchWord();
    game.allowInputs = true;
    game.currentTile = 0;
    game.endOfRow = WORD_LENGTH;
    game.attempts = 0;
    count = 0;
  }
}
