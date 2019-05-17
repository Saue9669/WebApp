var app;
var ws;

function Init() {
    app = new Vue({
        el: "#app",    
        data: {
            room : '',
            client_count: 0,
            username : '',
            login_password :'',
            register_password : '',
            password: '',
            new_message: "",
            scores: 0,
            time: 0,
            bricksBroken: 0,
            level: '',
            chat_messages: [],
            login_type: "",
            leaderboard: [],
            bestBricks: '',
            bestScore: '',
            bestTime: '',
            totalBricks: '',
            totalTime: '',
            totalScore: '',
            userStatsUsername: '',
        }
    });

    var port = window.location.port || "80";
    ws = new WebSocket("ws://" + window.location.hostname + ":" + port);
    ws.onopen = (event) => {
        console.log("Connection successful!" + ws);
        
    }
    ws.onmessage = (event) => {
        var message = JSON.parse(event.data);
        if(app.room == message.group){
            app.chat_messages.push(message.username+ ":  " + message.data);
            
        }
    }
var loginPass = document.getElementById("myInput2");
loginPass.oninput = function(event){
    app.login_password = loginPass.value;
}    
var RegisterPass = document.getElementById("myInput1");
RegisterPass.oninput = function(event){
    app.register_password = RegisterPass.value;
}
}
function getGroup(){
    var data =  document.getElementById("groupInput").value;
    app.chat_messages = [];
    
    if(data == ""){
        
    }else{
        app.room = data;
    }
}
function register() {
            app.password = app.register_password;                
            if(app.username !== "" && app.password !== ""){
                GetText("username?" + app.username).then((data) => {
                    if(data ==  "available username"){
                        var message = {msg : 'newUser', username : app.username, password : app.password}; 
                        
                        PostData("/newUser", message);
                        document.getElementById("homepage").style.display = "none";
                        document.getElementById("headerAndAvatar").style.display = "block";
                        document.getElementById("game").style.display = "block";
                        document.getElementById("chatHide").style.display = "block";
                        callGame();
 
                    }else{
                        alert("Sorry, this username is taken. Either log in or try a new username.");
                    }
               });
                
                
            }else{
                alert("Enter a real username and password");
            }

}


function login() {
        app.password = app.login_password;   
        if(app.username !== "" && app.password !== ""){
            
            GetText("login?username="+app.username+"&password="+app.password).then((data) => {
                
                document.getElementById("homepage").style.display = "none";
                document.getElementById("headerAndAvatar").style.display = "block";
                document.getElementById("game").style.display = "block";
                document.getElementById("chatHide").style.display = "block";
                callGame();
             });
        };

}


function showHome(){

document.getElementById("homepage").style.display = "none";
document.getElementById("headerAndAvatar").style.display = "block";
document.getElementById("game").style.display = "block";
document.getElementById("leaderboard").style.display = "none";
document.getElementById("userStats").style.display = "none"; 
}


function Broadcast(message){
    var id;
    for (id in clients) {
        if (clients.hasOwnProperty(id)) {
            clients[id].send(message);
        }
    }
}


function userStats(data){
    var username = data;
    GetText('/userStats?' + username).then((data) => {
        var totalBricks = 0;
        var totalTime = 0;
        var totalScore = 0;
        var holderScore = data[0].score;
        var highScoreIndex = 0; 
        for(var i = 0; i<data.length; i++){
            if(holderScore < data[i].score){
            highScoreIndex = i;
            holderScore = data[i].score;
            }
            totalBricks = totalBricks + data[i].bricks;
            totalTime = totalTime + data[i].time;
            totalScore = totalScore + data[i].score;
        }
        app.userStatsUsername = username; 
        app.totalBricks = totalBricks;
        app.totalTime = totalTime;
        app.totalScore = totalScore;
        app.bestScore = data[highScoreIndex].score;
        app.bestTime = data[highScoreIndex].time;
        app.bestBricks = data[highScoreIndex].bricks;
        
        document.getElementById("leaderboard").style.display = "none";
        document.getElementById("userStats").style.display = "block";
        });

}

function usernameSearch(event){
    if(app.username !== ""){
        GetJson("register?" + app.username+ app.password);
    }
}



function GetText(url) {
    return new Promise((resolve, reject) => { 
        $.get(url, (data) => {
            console.log("GetText");
            resolve(data);
        });
    });
}

function PostData(url, data){
    return new Promise((resolve, reject) => {
        $.post(url, data, (err, fields) => {
            
        });
    });
}

function showLeaderboard(){
    GetText('/showLeaderboard').then((data) => {
        
        document.getElementById("homepage").style.display = "none";
        document.getElementById("headerAndAvatar").style.display = "block";
        document.getElementById("game").style.display = "none";
        document.getElementById("leaderboard").style.display = "block";
        app.leaderboard = data;        
    });
}
    


function SendMessage(){
           
        var message = {username : app.username, group : app.room, data : app.new_message};
        
        
        if(app.room == ""){
        }else{
            ws.send(JSON.stringify(message));
        }
}


function callGame(){
    

        var game = new Phaser.Game(700, 475, Phaser.CANVAS, 'game', {
          preload: preload, create: create, update: update
        });
        var ball;
        var ballOnPaddle = true;
        var paddle;
        var bricks;
        var newBrick;
        var brickInfo;
        var bricksBroken = 0;
        var scoreText;
        var score = 0;
        var lives = 3;
        var livesText;
        var lifeLostText;
        var playing = false;
        var startButton;
        var level=1;
        var levelText;
        var saveScore = 0;
        var me = this;
        var finalTime;
        
        function preload() {
            game.scale.pageAlignHorizontally = true;
            game.scale.pageAlignVertically = true;
            game.stage.backgroundColor = '#eee';
            game.load.image('ball', 'pokeball.png');//loads objects
            game.load.image('paddle', 'paddle.png');
            game.load.image('brick', 'money.png');
            game.load.spritesheet('button', 'button.png', 120, 40);
            game.load.image('background', 'moving.png');
        }
        function create() {
            this.tileSprite = game.add.tileSprite(0,0,700,475,'background');
            this.tileSprite.autoScroll(-100,0);
            game.stage.backgroundColor = "#4488AA";
            game.physics.startSystem(Phaser.Physics.ARCADE);//initialize arcade physics engine
            game.physics.arcade.checkCollision.down = false;//allows ball to fall through bottom will allow to lose
            ball = game.add.sprite(game.world.width*0.5, game.world.height-50, 'ball');//positions ball on paddle
            game.physics.enable(ball, Phaser.Physics.ARCADE);//enables our ball for physics system
            ball.body.collideWorldBounds = true;
            if(level==1) {
                ball.body.bounce.set(1);
            } else {
                ball.body.bounce.set(1.05);
            }
            ball.checkWorldBounds = true;
            ball.events.onOutOfBounds.add(ballLeaveScreen, this);
            paddle = game.add.sprite(game.world.width*0.5, game.world.height-5, 'paddle');//adds and positions paddle
            paddle.anchor.set(0.5,1);//anchor to position paddle in middle
            game.physics.enable(paddle, Phaser.Physics.ARCADE);//enable physics
            paddle.body.immovable = true;
            
            
            if(level == 1) {
                initBricks();
                startTime = new Date();
                totalTime = 120;
                timeElapsed = 0;
                gameTimer = game.time.events.loop(100, function(){
                   updateTimer();
                });
                createTimer();
            }
            else {
                sampleLevel();
            }
            textStyle = { font: '18px Arial', fill: '#ff96a0' };
            scoreText = game.add.text(5, 5, 'Points: '+score, textStyle);//score
            livesText = game.add.text(game.world.width-5, 5, 'Lives: '+lives, textStyle);//adds lives to the game and where to put these lives
            levelText = game.add.text(game.world.width-5, 5, 'Level: '+level, textStyle);
            livesText.anchor.set(1,0);//anchoring lives to the top right of the screen
            levelText.anchor.set(1,-16);
            lifeLostText = game.add.text(game.world.width*0.5, game.world.height*0.5, 'Life lost, click to continue', textStyle);
            lifeLostText.anchor.set(0.5);//centers lifelosttext in the middle of screen
            lifeLostText.visible = false;
            startButton = game.add.button(game.world.width*0.5, game.world.height*0.5, 'button', startGame, this, 1, 0, 2);//adds start button to the game in the middle of screen
            startButton.anchor.set(0.5);
        }
        function update() {
            game.physics.arcade.collide(ball, paddle);//enable collision
            game.physics.arcade.collide(ball, bricks, ballHitBrick);//collision for ball hitting brick
            if(ballOnPaddle) {
                ball.body.x = paddle.x - (ball.width / 2);
            }
            if(playing) {
                paddle.x = game.input.x || game.world.width*0.5;//sets input position to be in middle of screen
            }
        }
        function initBricks() {
                brickInfo = {
                width: 50,
                height: 10,
                count: {
                    row: 2,
                    col: 7
                },
                offset: {
                    top: 90,
                    left: 110
                },
                padding: 30
            };
            bricks = game.add.group();
            for(c=0; c<brickInfo.count.col; c++) {
                for(r=0; r<brickInfo.count.row; r++) {
                    var brickX = (c*(brickInfo.width+brickInfo.padding))+brickInfo.offset.left;
                    var brickY = (r*(brickInfo.height+brickInfo.padding))+brickInfo.offset.top;
                    newBrick = game.add.sprite(brickX, brickY, 'brick');
                    game.physics.enable(newBrick, Phaser.Physics.ARCADE);
                    newBrick.body.immovable = true;
                    newBrick.anchor.set(0.5);
                    bricks.add(newBrick);
                }
            }
        }
        function sampleLevel() {
                brickInfo = {
                width: 50,
                height: 10,
                count: {
                    row: 5,
                    col: 8
                },
                offset: {
                    top: 90,
                    left: 80
                },
                padding: 30
            };
            bricks = game.add.group();
            for(c=0; c<brickInfo.count.col; c++) {
                for(r=0; r<brickInfo.count.row; r++) {
                    var brickX = (c*(brickInfo.width+brickInfo.padding))+brickInfo.offset.left;
                    var brickY = (r*(brickInfo.height+brickInfo.padding))+brickInfo.offset.top;
                    newBrick = game.add.sprite(brickX, brickY, 'brick');
                    game.physics.enable(newBrick, Phaser.Physics.ARCADE);
                    newBrick.body.immovable = true;
                    newBrick.anchor.set(0.5);
                    bricks.add(newBrick);
                }
            }
        }
        function putBallOnPaddle() {
            ballOnPaddle = true;
            ball.reset(paddle.body.x, paddle.body.y - paddle.body.height);
        }
        function ballHitBrick(ball, brick) {
            var killTween = game.add.tween(brick.scale);
            killTween.to({x:0,y:0}, 200, Phaser.Easing.Linear.None);
            killTween.onComplete.addOnce(function(){
                brick.kill();
            }, this);
            killTween.start();
            score += 10;
            bricksBroken++;
            scoreText.setText('Points: '+score);
            
            if(score === brickInfo.count.row*brickInfo.count.col*10 + saveScore) {
                console.log("score = "+score);
                console.log("brick calc = "+(brickInfo.count.row*brickInfo.count.col*10)+saveScore);
                if(level==2 && (score == (brickInfo.count.row*brickInfo.count.col*10)+saveScore)) {
                    alert('You won the game, congratulations!');
                    
                    app.bricksBroken = bricksBroken;
                    app.score = score;
                    app.time = finalTime;
                    var message = {username : app.username, score:app.score, time:app.time, bricksBroken:app.bricksBroken};
                    PostData('/updateLeaderboard', message); 
                    game.destroy();
                    callGame();
                }
                saveScore = score;
                level = level + 1;
                console.log(level);
                paddle.kill();
                ball.kill();
                scoreText.destroy();
                livesText.destroy();
                levelText.destroy();
                ballOnPaddle = true;
                create();
            }
        }
        function ballLeaveScreen() {
            lives=lives-1;
            ballOnPaddle = true;
            if(lives) {
                livesText.setText('Lives: '+lives);
                lifeLostText.visible = true;
                ball.reset(game.world.width*0.5, game.world.height-55);
                paddle.reset(game.world.width*0.5, game.world.height-5);
                game.input.onDown.addOnce(function(){
                    ballOnPaddle = false;
                    lifeLostText.visible = false;
                    ball.body.velocity.set(150, -150);
                }, this);
            }
            else {
                alert('You lost, game over!');
                app.bricksBroken = bricksBroken;
                app.score = score;
                app.time = finalTime;
            
                var message = {username: app.username, score:app.score, time:app.time, bricksBroken:app.bricksBroken};
                PostData('/updateLeaderboard', message);
                game.destroy();
                callGame();     
            }
        }
        function ballHitPaddle(ball, paddle) {
            ball.animations.play('wobble');
            ball.body.velocity.x = -1*5*(paddle.x-ball.x);
        }
        function startGame() {
            startButton.destroy();
            ball.body.velocity.set(150, -150);
            playing = true;
            ballOnPaddle = false;
        }
        function createTimer() {
            var me = this;
            timeLabel = game.add.text(game.world.centerX, 100, "00:00", {font: "25px Arial", fill: "#fff"});
            timeLabel.anchor.setTo(5.5, -9.7);
            timeLabel.align = 'center';
        }
        function updateTimer() {
            var me = this;
            var currentTime = new Date();
            var timeDifference = startTime.getTime() - currentTime.getTime();
            //Time elapsed in seconds
            timeElapsed = Math.abs(timeDifference / 1000);
            //Convert seconds into minutes and seconds
            var minutes = Math.floor(timeElapsed / 60);
            var seconds = Math.floor(timeElapsed) - (60 * minutes);
            //Display minutes, add a 0 to the start if less than 10
            var result = (minutes < 10) ? "0" + minutes : minutes; 
            //Display seconds, add a 0 to the start if less than 10
            result += (seconds < 10) ? ":0" + seconds : ":" + seconds; 
            timeLabel.text = result;
            finalTime = minutes + seconds;
        }       

}
        function changeImg(info) {
          if (info == '') { return; }
          document.getElementById('mainImage').src = info;
          document.getElementById('SBox').style.display = 'none';
        }







