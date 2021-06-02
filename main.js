const options = {
    task: 'classification',
    debug: true
}

const nn = ml5.neuralNetwork(options);

var canvas = document.getElementById("canvas")
var ctx = canvas.getContext("2d")

var world = {score: 0, result:undefined, keyDown:false, stop:false, ai:false , frameCount:0, player:{y:300, velocityY:0}, gravity:0.5, speedIncrease: 0.001, cactus:{x:canvas.width, speed: 10}}

var gameData = []

function draw() {
    // background
    ctx.fillStyle = "#00aaee"
    ctx.fillRect(0,0,canvas.width,canvas.height)

    ctx.fillStyle = "green"
    ctx.fillRect(0, 300, canvas.width, canvas.height-300)

    ctx.fillStyle = "white"
    ctx.textBaseline = "top"
    ctx.font = "20px sans-serif"
    ctx.fillText("Score: " + world.score, 5, 5)

    if(world.result) {
        world.result.sort((a,b)=>{
            if(a.label < b.label) { return 1}
            else { return -1}
        })

        let result = world.result
        ctx.fillText(result[0].label + ": " + Math.round(result[0].confidence * 100) + "%", 5, 30)
        ctx.fillText(result[1].label + ": " + Math.round(result[1].confidence * 100) + "%", 5, 55)
    }

    // player
    ctx.fillStyle = "white"
    ctx.fillRect(20, world.player.y-40, 20, 40)

    world.player.y += world.player.velocityY

    world.player.velocityY += world.gravity

    if(world.player.y > 300) {
        world.player.y = 300
    }

    // cactus
    ctx.fillStyle = "lightGreen"
    ctx.fillRect(world.cactus.x, 260, 20, 40)

    world.cactus.x -= world.cactus.speed

    if(world.cactus.x < -20) {
        world.cactus.x = canvas.width + Math.floor(Math.random()*400)
    }

    if(world.player.y > 260 && world.cactus.x<40 && world.cactus.x>0) {
        playerDies()
    }

    world.cactus.speed += world.speedIncrease
    world.score += 10

    if(gameData.length > 2000 && !world.ai) {
        giveMeGame()
    } else {
        saveData(world.frameCount, world.keyDown)
    }

    world.frameCount++

    if(world.ai) {
        const input = {
            cactusPosition: world.cactus.x,
            cactusSpeed: world.cactus.speed,
        }
        console.log("classifying")
        nn.classify(input, handleResults);

        function handleResults(err, result) {
            if(err){
                return console.error(err)
            }

            world.result = result

            if(world.player.y >= 300 && result[0].label === "Jumped") {
                world.player.velocityY = -10
            }

            requestAnimationFrame(draw)

            // console.log(result)
        }

    }

    if(!world.stop && !world.ai) {
        requestAnimationFrame(draw)
    }
}

function playerDies() {
    world.cactus.x = canvas.width
    world.player.y = 300
    world.player.velocityY = 0
    world.cactus.speed = 10
    world.score = 0
    console.log("You suck, get good".toUpperCase())
}

document.onkeydown = function(evt) {
    if(world.player.y >= 300 && world.ai === false) {
        console.log("YUMP")
        world.keyDown = true
        world.player.velocityY = -10
    }
};

canvas.onclick = ()=>{
    draw()
    console.log("started")
    canvas.onclick = () => {}
}

document.onkeyup = function(evt) {
    if(world.ai === false) {
        console.log("UNYUMP")
        world.keyDown = false
    }
};

function saveData(frame, isJump) {
    if(typeof gameData[frame] === 'undefined') {
        gameData.push({ cactusPosition: Math.floor(world.cactus.x), cactusSpeed: world.cactus.speed, jump:isJump?"Jumped":"Did not Jump"})
    }
}

function giveMeGame() {
    console.log(gameData)
    world.stop = true
    doTheFunnyMachineTortureThingy()
}

function doTheFunnyMachineTortureThingy() {
    console.log("processing data")

    // Step 4: add data to the neural network
    gameData.forEach(item => {
        const inputs = {
            cactusPosition: item.cactusPosition,
            cactusSpeed: item.cactusSpeed,
        };
        const output = {
            jump: item.jump
        };

        // if(item.jump === 1 || Math.random() < 0.1) {
            nn.addData(inputs, output);
        // }

    });

    console.log("normalizing data")

    // Step 5: normalize your data;
    nn.normalizeData();

    console.log("training the model")

    // Step 6: train your neural network
    const trainingOptions = {
        epochs: parseInt(document.getElementById("epochs").value),
        batchSize: parseInt(document.getElementById("batchSize").value)
    }
    nn.train(trainingOptions, finishedTraining);

    // Step 7: use the trained model
    function finishedTraining(){
        console.log("model done")
        playerDies()

        world.ai = true
        world.stop = false

        draw()
    }
}
