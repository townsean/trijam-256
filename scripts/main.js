let _gameTimer;
let _pixelPercentage = 3;
let _animals = [];

main();

/**
 * Application starting point
 */
function main() {
    const startButton = document.getElementById('start-game-button');
    startButton.addEventListener('click', () => {
        const startScene = document.getElementById('start-scene');
        startScene.classList.add('hidden');

        clearInterval(countdownHeadingInterval);
        startGame();
    });

    const restartButton = document.getElementById('restart-game-button');
    restartButton.addEventListener('click', () => {
        const endScene = document.getElementById('end-scene');
        endScene.classList.add('hidden');

        startGame();
    });

    const countdownHeading = document.getElementById('countdown-heading');
    let currentCountdown = 0;
    let countdownHeadingInterval = setInterval(() => {
        if(currentCountdown == -1) {
            currentCountdown = 3;
        }

        countdownHeading.innerText = `00:0${currentCountdown}`;
        currentCountdown--;
    }, 1000);
}

/**
 * Loads data from json file
 * @returns Collection of animals
 */
async function getAnimals() {
    let animals = [];
    try {
        const response = await fetch('scripts/data.json');
        if(response.ok) {
            const data = await response.json();
            if(data) {
                animals = data.animals;
            } else {
                throw response.statusText;
            }
        }
    } catch (error) {
        console.log(error);
    }

    return animals;
}

/**
 * Start a new game
 */
async function startGame() {
    const playScene = document.getElementById('play-scene');
    playScene.classList.remove('hidden');

    // reset pixelate percentage
    _pixelPercentage = 3;

    // Maximize chances of seeing different animals
    if(_animals.length < 4) {
        _animals = await getAnimals();
    }

    const hiddenAnimal = getRandomElement(_animals);
    const incorrectOptionA = getRandomElement(_animals);
    const incorrectOptionB = getRandomElement(_animals);

    // re-add incorrect options to list of available animals for future round
    _animals.push(incorrectOptionA);
    _animals.push(incorrectOptionB);

    const indexes = [0, 1, 2];

    const options = [
        {
            animal: hiddenAnimal,
            isAnswer: true,
            index: getRandomElement(indexes)
        },
        {
            animal: incorrectOptionA,
            isAnswer: false,
            index: getRandomElement(indexes)
        },
        {
            animal: incorrectOptionB,
            isAnswer: false,
            index: getRandomElement(indexes)
        }
    ]

    // Sort multiple choice options by random indexes
    options.sort((a, b) => a.index - b.index);

    const multipleChoiceButtonGroup = document.getElementById('multiple-choice-button-group');
    multipleChoiceButtonGroup.innerHTML = '';
    for(let option of options) {
        const button = createAnimalButton(option);
        multipleChoiceButtonGroup.appendChild(button);
    }

    // Setup canvas
    const [canvas, context, canvasImage] = setupPixelatedCanvas(hiddenAnimal);

    // Setup game timer
    const countdownTimer = document.getElementById('countdown-timer');
    countdownTimer.innerText = `00:03`;
    let seconds = 2;
    _gameTimer = setInterval(() => {
        if(seconds == -1) {
            endGame(false);
            clearInterval(_gameTimer);
        } else {
            countdownTimer.innerText = `00:0${seconds}`;
            _pixelPercentage += 2;
            pixelate(canvas, context, canvasImage);
            seconds--;
        }
    }, 1000);

    // Setup endgame results
    const image = document.getElementById("image");
    image.src = hiddenAnimal.assetUrl;

    const imageCaption = document.getElementById("image-caption");
    imageCaption.innerText = `It's a ${hiddenAnimal.name}!`;
}

/**
 * Pixelate animal image
 * @param {*} animal Animal to obfuscate
 */
function setupPixelatedCanvas(animal) {
    const canvas = document.getElementById('pixelated-canvas');
    const context = canvas.getContext('2d');
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.src = animal.assetUrl;

    image.onload = function() {
        canvas.height = image.height/4;
        canvas.width = image.width/4;
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        pixelate(canvas, context, image);
    };

    return [canvas, context, image];
}

/**
 * Pixelate image canvas
 */
function pixelate(canvas, context, image) {
    canvas.height = image.height;
    canvas.width = image.width;

    const size = (_pixelPercentage) * 0.01;
    let w = canvas.width * size;
    let h = canvas.height * size;

    context.drawImage(image, 0, 0, w, h);
    context.imageSmoothingEnabled = false;
    context.drawImage(canvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
}

/**
 * Ends current game
 * @param {*} didPlayerWin Boolean indicating whether or not the player won
 * @param {*} animal Animal associated with the player's guess
 */
function endGame(didPlayerWin, animal) {
    const gameOverHeading = document.getElementById('game-over-heading');

    if(!animal && !didPlayerWin) {
        // Time ran out
        gameOverHeading.innerText = "Time's up!"
    } else if (!didPlayerWin) {
        gameOverHeading.innerText = "Wrong animal!"
    } else {
        gameOverHeading.innerText = "You guessed correctly!"
    }

    // Switch from play game scene to end game scene
    const playScene = document.getElementById('play-scene');
    playScene.classList.add('hidden');

    const endScene = document.getElementById('end-scene');
    endScene.classList.remove('hidden');
}

/**
 * Gets a random element from the given collection, removes it from future selection and returns element
 * @param {*} collection 
 * @returns Random element from the given collection
 */
function getRandomElement(collection) {
    const index = getRandomInt(0, collection.length);
    const element = collection[index];
    collection.splice(index, 1);

    return element;
}

/**
 * Create a new button asssociated with an animal
 * @param {*} animal 
 */
function createAnimalButton(animalOption) {
    const button = document.createElement('button');
    button.innerHTML = animalOption.animal.name;
    button.addEventListener('click', () => {
        clearInterval(_gameTimer);
        endGame(animalOption.isAnswer, animalOption.animal);
    });

    return button;
}

/**
 * Gets a random number between min (inclusive) and max (exclusive)
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random#getting_a_random_integer_between_two_values
 * @param {*} min Minimum number
 * @param {*} max Maximum number
 * @returns A random number between min and max
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min) + min);
}