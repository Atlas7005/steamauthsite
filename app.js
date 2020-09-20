var express = require('express');
var app = express();
var totp = require('steam-totp');
var cors = require('cors');

app.use(cors());

/**
 * @todo index.html - Seperate style.
 * @body Transfer the <style> to own style.css file.
 */

function getCode(secret) {
	return String(totp.getAuthCode(secret)) == null ? null : String(totp.getAuthCode(secret));
};

var accounts = [
	{
		name: "name1",
		secret: "someauthsecret" 
	},
	{
		name: "name2",
		secret: "someauthsecret2"
	}
];

app.get("/:account", (req, res, next) => {
	var params = req.params;
	
	if(params.account) {
		for (var i = 0; i < accounts.length; i++) {
			if(accounts[i].name.toLowerCase() == params.account.toLowerCase()) {
				res.send(getCode(accounts[i].secret));
				return;
			} else if(i == accounts.length-1) {
				res.send(404);
			}
		}
	}
});

app.get("/", (req, res, next) => {
	res.sendFile(__dirname+"/public/index.html");
});

var server = require('http').createServer(app).listen(80);
var io = require('socket.io')(server);

io.on("connection", (socket) => {
	accounts.forEach((account) => {
		socket.emit("code", { "user": `${account.name}`, "code": `${getCode(account.secret)}` });
		var oldCode;
		setInterval(() => {
			if(oldCode != null) {
				if(oldCode.toLowerCase() != getCode(account.secret).toLowerCase()) {
					socket.emit("code", { "user": `${account.name}`, "code": `${getCode(account.secret)}` });
					oldCode = getCode(account.secret);
				}
			} else {
				socket.emit("code", { "user": `${account.name}`, "code": `${getCode(account.secret)}` });
				oldCode = getCode(account.secret);
			}
		}, 1500);
	});
});
