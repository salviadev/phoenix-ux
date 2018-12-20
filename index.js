var fs = require('fs');
var express = require('express');
var devServer = require('@phoenix/phoenix-seed');
var app = express();
//Load config
var config = JSON.parse(fs.readFileSync('./config.json'));
//Root path
config.rootPath = __dirname;

//Init routes
devServer.init(app, config);
//Http config 
config.http = config.http || {};
config.http.port = process.env.PORT || config.http.port || 9999;
//start application server
app.listen(config.http.port, function() {
    console.log("Developpment server started at port %d", config.http.port);
});