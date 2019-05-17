var path = require('path');
var url = require('url');
var express = require('express');
var sqlite3 = require('sqlite3');
var http = require('http');
var WebSocket = require('ws');
var multiparty = require('multiparty');
var bodyParser = require('body-parser');
var app = express();
var server = http.createServer(app);
var port = 8018;
var url_search = require('url-search-params');
var md5 = require('js-md5');
var public_dir = path.join(__dirname, 'public');
var fs = require('fs');




var db = new sqlite3.Database('db', sqlite3.OPEN_READWRITE, (err) => {
    if(err) {
        console.log('error opening');
    }else{
        console.log('Now connected');
    }

});
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());



app.get('/userStats', (req, res) => {
    var req_url = url.parse(req.url);
    var query = decodeURI(req_url.query);
    
    db.all('SELECT * FROM leaderboard WHERE uname = ?', [query], (err, rows) => {
        if(err){
            console.log(err);
        }else{
            res.writeHead(200, {'Content-Type' : 'application/json'});
            res.write(JSON.stringify(rows));
            res.end();
        }
    
    });
});

app.get('/username', (req, res) => {

    var req_url = url.parse(req.url);
    var query = decodeURI(req_url.query);

    
    db.all('SELECT * FROM username WHERE uname = ?', [query], (err, rows) => {
        if (err){
            console.log(err);

        }else{
            if(rows.length === 0){
                console.log("empty");
                res.writeHead(200, {'Content-Type' : 'text/plain'});
                res.write("available username");
                res.end();
            }else if(rows.length >0 && rows !== undefined){
                console.log("This username is being used");
                res.writeHead(200, {'Content-Type' : 'text/plain'});
                res.write("Username taken");
                
                res.end();
            }        
        }
 
       
    });
});

app.get('/showLeaderboard', (req, res) => {
     db.all('SELECT * FROM leaderboard ORDER BY score DESC LIMIT 10', (err, rows) => {
        if(err){
            console.log(err);
        }else{
            res.writeHead(200, {'Content-Type' : 'application/json'});
            res.write(JSON.stringify(rows));
            res.end();
        }
    });


});

app.post('/newUser', (req, res) => {
    var req_url = url.parse(req.url);
    var query = decodeURI(req_url.query);
    var hashedPassword = md5(req.body.password);
    db.all('INSERT INTO username VALUES(?, ?)',[req.body.username, hashedPassword], (err) => {
        if(err){
            console.log("error"+ err);
        }else {
       
        }
        
    });

});

app.post('/updateLeaderboard', (req, res) => {
    var req_url = url.parse(req.url);
    var rounds = 1;
    db.all('SELECT * FROM leaderboard', (err, rows) => {
        if(err){
            rounds = 1;
            console.log(err + "at spot 1");
        }else{
            rounds= rows.length + 1;
            console.log(rows.length);
        }
    
    db.all('INSERT INTO leaderboard VALUES(?, ?, ?, ?, ? )', [rounds, req.body.username, req.body.score, req.body.time, req.body.bricksBroken], (err) => {
        if(err){
            console.log(err +"at spot 2");
        }

    });
    db.all('SELECT * FROM leaderboard WHERE uname = ?', [req.body.username], (err, rows) => {
        if (err){
            console.log(err);

        }else{
            

        }
    });
    });
});

app.get("/login", (req, res) => {
    var req_url = url.parse(req.url, true);
    var givenUsername = req_url.query.username;
    var givenPassword = req_url.query.password;
    var hashedPassword = md5(givenPassword);
    db.all('SELECT *  FROM username WHERE uname = ? AND password = ?', [givenUsername, hashedPassword], (err, rows) => {
        if(err){
            console.log(err);
            console.log("username and password does not exist");
            
        }else{
            
            if(rows.length !== 0){ 
                console.log("Match");
                res.writeHead(200);
                res.write("Logged In");
                res.end();
                
                
            }else{
                console.log("Username and password are not contained");
            }
        }
    });
    db.all('SELECT * FROM leaderboard WHERE uname = ?', [givenUsername], (err, rows) => {
        if(err){
            console.log(err);
        }else{   
            console.log(rows);
       } 

    });

});



app.use(express.static(public_dir));

//app.post here is needed to put the new username and password into the database.
//also going to need to post the scores to the leaderboards


var wss = new WebSocket.Server({server: server});
var clients = {};
var messages = [];
var client_count = 0;
wss.on('connection', (ws) => {
    var client_id = ws._socket.remoteAddress + ":" + ws._socket.remotePort;
    console.log('New connections: ' + client_id);
    clients[client_id] = ws;
    //message will hold the type of message and the selected chat room number 
    ws.on('message', (message)  => {
        console.log(message);
        var data = JSON.parse(message);
        console.log(data);
            
        console.log("Message from " + client_id);
        Broadcast(message);
    });    
    
    ws.on('close', () => {
        delete clients[client_id];
    });
});

function Broadcast(message){
    var id;
    for(id in clients){
        if(clients.hasOwnProperty(id)){
            clients[id].send(message);
        }
    }
}

server.listen(port, '0.0.0.0'); 
console.log('Now listening on port ' + port);
