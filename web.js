// Express initialization
var express = require('express');
var app = express(express.logger());
app.use(express.bodyParser());
app.set('title', 'nodeapp');

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});

// Mongo initialization
var mongoUri = process.env.MONGOLAB_URI || 
   process.env.MONGOHQ_URL || 
  'mongodb://localhost:27017/scorecenter';
var mongo = require('mongodb');
var db = mongo.Db.connect(mongoUri, function (error, databaseConnection) {
	db = databaseConnection;
});

app.get('/', function (request, response) {
	response.set('Content-Type', 'text/html');
	db.collection('scorecenter', function(err, collection){
		var display = '';
		collection.find(function(err, cursor){
			cursor.each(function(err, output){
				if(output)
				{
					display = display + '<tr><td>' + output.username + '</td><td>' + output.game_title + '</td><td>' + output.score + '</td><td>' + output.created_at + '</td></tr>';
				}
				else{
					response.send('<head><title>ScoreCenter</title></head><body><h1>Score Center</h1><p><a href="/usersearch">Search for a User</a></p><p>To search highscores by a particular game, click on <a href="/highscores.json">this link</a> and add ?game_title=WHAT_GAME_YOU_WOULD_LIKE_TO_SEE to the URL</p><table border="1"><tr><td> User </td><td> Game </td><td> Score </td><td> Date </td></tr>' + display + '</table></body>');
				}
			});
		});
	});
});

app.get('/highscores.json', function(request, response) {
	var gamename = request.query;
	response.set('Content-Type', 'text/html');
	db.collection('scorecenter', function(err, collection){
		var add = '[';
		collection.find(gamename).sort({score:-1}).limit(10, function(err, cursor){
			cursor.each(function(err, item){
				if(item)
				{
					highscore = JSON.stringify(item);
					add = add + highscore;
				}
				else{
					add = add + ']';
					response.send('<head><title>HighScores</title></head><body><h1>High Scores</h1>' + add + '</body>');
				}
			});
		});
	});
});

app.get('/usersearch', function(req, res){
	res.set('Content-Type', 'text/html');
	res.send('<head><title>UserSearch</title></head><body><p>Please enter the name of the user for who you would like to see their high scores!</p><form name="input" action="username" method="get">Enter the Username: <input type="text" name="user" id="input"><input type="submit" id="submit" value="Submit"></form></body>');
});

app.get('/username', function(req, res){
	res.set('Content-Type', 'text/html');
	var user = req.query.user;
	db.collection('scorecenter', function(err, collection){
		var display = '';
		var count = 0;
		collection.find(function(err, cursor){
			cursor.each(function(err, output){
				if(output)
				{
					if(output.username == user)
					{
						count++;
						display = display + '<tr><td>' + output.username + '</td><td>' + output.game_title + '</td><td>' + output.score + '</td><td>' + output.created_at + '</td></tr>';
					}
				}
				else
				{
					if(count == 0)
					{
						res.send('<head><title>UserSearch</title></head><body>No Highscores For This User</body>');
					}
					else
					{
						res.send('<head><title>UserSearch</title></head><body><table border="1"><tr><td> User </td><td> Game </td><td> Score </td><td> Date </td></tr>' + display + '</table></body>');
					}
				}
			});
		});
	}); 
});

app.post('/submit.json', function(req, res){
	res.set('Content-Type', 'text/json');
	res.header("Access-Control-Allow-Origin","*");
	res.header("Access-Control-Allow-Headers", "X-Requested-With");
	var user = req.body.username;
	var score = req.body.score;
	var game_title = req.body.game_title;
	db.collection('scorecenter', function(err, collection){
		data = {"username":user,"game_title":game_title,"score":score,"created_at":Date()};
		collection.insert(data);
	});
});
