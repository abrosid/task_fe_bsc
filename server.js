var express = require('express');
var app=express();
const PORT = process.env.PORT || 9000;
app.use('/lib', express.static('lib'));
app.use('/app', express.static('app'));
app.get('/', function(req, res){
  res.sendFile(__dirname + '/app/index.html');
});

app.listen(PORT, function(err){
	if(err){
		console.error(err);
	}else{
		console.log('listening on *:'+PORT);
	}
  
});

