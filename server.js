var express = require('express');
var app=express();
app.use('/lib', express.static('lib'));
app.use('/app', express.static('app'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/app/index.html');
});

app.listen(9000, function(){
  console.log('listening on *:9000');
});

