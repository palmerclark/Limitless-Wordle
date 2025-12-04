const Config = {
  word_length: 5,
  rows: 6,
  max_attempts: 6,
  colors: {
    default: "rgb(170, 170, 170)",
    correct: "rgb(83, 141, 78)",
    present: "rgb(181, 159, 59)",
  }
};
//Game State
let divs;
const game = {
  solution: "",
  currentTile: 0,
  endOfRow: Config.word_length,
  attempts: 0,
  correct_letters: 0,
  allowInputs: true,
  gameOver: false,
  colors: Array(Config.word_length).fill(Config.colors.default),
};

async function startGame() {
  await fetchWord();
  generateUserFields();
}

async function fetchWord() {
  while (true) {
    try {
      const response = await fetch("http://localhost:3000/random-word");
      if (!response.ok) throw new Error("Server not ready.");
      const data = await response.json();
      game.solution = data.word;
      return;
    } catch (err) {
      console.warn("Retrying word fetch...", err);
      await new Promise((res) => setTimeout(res, 300));
    }
  }
}

function generateUserFields() {
  generateBoard();
  generateKeyboard();
}

function generateBoard() {
  const table = document.getElementById("table");

  for (let i = 0; i < Config.word_length * Config.rows; i++) {
    const tile = document.createElement("div");
    tile.classList.add("tile");
    table.appendChild(tile);
  }
  divs = document.querySelectorAll("div.tile");
}

function generateKeyboard() {
  const keys = [
    ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "BACKSPACE"],
    ["A", "S", "D", "F", "G", "H", "J", "K", "L", "ENTER"],
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

startGame();
//UI Feedback & Animations
function triggerShake(e) {
  e.classList.add("shake");
  e.addEventListener("animationend", onAnimationEnd);

  function onAnimationEnd() {
    e.classList.remove("shake");
    e.removeEventListener("animationend", onAnimationEnd);
  }
}

function displayMessage(message) {
  let alertDiv = document.getElementById("alert");
  alertDiv.textContent = message;
  alertDiv.style.visibility = "visible";
  setTimeout(() => {
    alertDiv.style.visibility = "hidden";
  }, 1500);
}

//Input Handling
addEventListener("keydown", gatherTypedInputs);
function gatherTypedInputs(e) {
  const input = e.key.toUpperCase();
  printInputs(input);
}

document.getElementById("keyboard").addEventListener("click", gatherButtonInputs);
function gatherButtonInputs(e) {
  const button = e.target.closest("button");
  if (!button) {
    return;
  }
  printInputs(button.textContent);
}

function printInputs(input) {
  if (!game.allowInputs) {
    return;
  } 
  
  const row_start = game.endOfRow - Config.word_length;
  const row_full = game.currentTile == game.endOfRow;

  if(input == "ENTER"){
    if(!row_full){
      for(let i = row_start; i < game.currentTile; i++){
        triggerShake(divs[i]);
      }
      displayMessage("Not enough letters!");
      return;
    }

    let guess = "";
    for(let i = row_start; i < row_start + Config.word_length; i++){
      guess += divs[i].textContent;
    }
    compareToSolution(guess);
    game.endOfRow += Config.word_length;
    game.attempts++;
    return;
  }

  if(input == "BACKSPACE"){
    if(game.currentTile > row_start){
      game.currentTile--;
      divs[game.currentTile].textContent = "";
      return;
    }
  }

  if(input.match(/^[A-Z]$/) && !row_full){
    divs[game.currentTile].textContent = input;
    game.currentTile++;
  }
}

//Game Logic

function compareToSolution(guess) {
  game.correct_letters = 0;
  game.colors = Array(Config.word_length).fill(Config.colors.default);
  let greens = Array(Config.word_length);
  let yellows = Array(Config.word_length);
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] == game.solution[i]) {
      greens[i] = guess[i];
      game.colors[i] = Config.colors.correct;
      game.correct_letters++;
    }
  }

  for (let i = 0; i < guess.length; i++) {
    if (
      game.solution.indexOf(guess[i]) >= 0 &&
      greens.indexOf(guess[i]) < 0 &&
      yellows.indexOf(guess[i]) < 0
    ) {
      game.colors[i] = Config.colors.present;
      yellows[i] = guess[i];
    } else if (game.solution.indexOf(guess[i]) < 0) {
      game.colors[i] = Config.colors.default;
    }
  }

  game.allowInputs = false;
  for (let i = 0; i < guess.length; i++) {
    let tile = divs[game.currentTile - Config.word_length + i];
    setTimeout(() => {
      tile.classList.add("flip");
      setTimeout(() => {
        tile.style.backgroundColor = game.colors[i];
      }, 500);
    }, i * 500 + 100);
  }

  setTimeout(() => {
    updateKeyboard(guess);
    if(!determineGameOver()){
      game.allowInputs = true;
    }
  }, guess.length * 500 + 100);
}

function determineGameOver(){
  if (game.correct_letters == Config.word_length) {
      displayMessage("You win!");
      game.gameOver = true;
      endGame();
  } 
  else if (game.attempts == Config.max_attempts) {
      displayMessage(game.solution);
      game.gameOver = true;
      endGame();
  }
  return game.gameOver;
}

function updateKeyboard(guess) {
  const buttons = document.getElementsByClassName("key");

  for (let i = 0; i < Config.word_length; i++) {
    const letter = guess[i];
    const color = game.colors[i];

    for (let j = 0; j < buttons.length; j++) {
      if (buttons[j].textContent == letter) {
        const currentColor = buttons[j].style.backgroundColor;

        if (currentColor == "") {
          buttons[j].style.backgroundColor = color;
        } else if (color == Config.colors.correct) {
          // green
          buttons[j].style.backgroundColor = color;
        } else if (
          color == Config.colors.present &&
          currentColor == Config.colors.default
        ) {
          buttons[j].style.backgroundColor = color;
        }
      }
    }
  }
}

// Game Reset / Replay
function endGame() {
  setTimeout(() => {
    const summary = document.getElementById("summary");
    summary.style.visibility = "visible";
  }, 1500);
}

document.getElementById("next_game").addEventListener("click", resetGame);
function resetGame(e) {
  if (e.target.id == "next_game") {
    resetGameState();
    resetUserFields();
    startGame();
    document.getElementById("summary").style.visibility = "hidden";
  }
}

function resetUserFields(){
  document.getElementById("table").innerHTML = "";
  document.getElementById("keyboard").innerHTML = "";
}

function resetGameState(){
  game.currentTile = 0;
  game.endOfRow = Config.word_length;
  game.attempts = 0;
  game.correct_letters = 0;
  game.colors.fill(Config.colors.default);
  game.gameOver = false;
  game.allowInputs = true
}