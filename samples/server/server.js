var http = require('http');
var fs = require('fs');
var url = require('url');

var app_handler = function(req, res) {
  var path, _url;
  _url = url.parse(decodeURI(req.url), true);
  path = _url.pathname === '/' ? '/index.html' : _url.pathname;
  console.log(req.method + " - " + path);
  fs.readFile(__dirname + path, function(err, data) {
    if (err) {
      res.writeHead(500);
      res.end('error load file');
    }
    res.writeHead(200);
    res.end(data);
  });
};

var app = http.createServer(app_handler);
var io = require('socket.io').listen(app);
io.set('log level', 2);

// var ArduinoFirmata = require('arduino-firmata');
var ArduinoFirmata = require('../../');
arduino = new ArduinoFirmata().connect();


// emit sensor-value to HTML-side
arduino.on('analogChange', function(e){
  if(e.pin != 0) return;
  console.log(e);
  io.sockets.emit('analogRead', e.value);
});

io.sockets.on('connection', function(socket) {

  socket.emit('analogRead', arduino.analogRead(0));

  // on click button on HTML-side, change LED
  socket.on('digitalWrite', function(stat) {
    console.log("pin13:"+stat);
    arduino.digitalWrite(13, stat);
  });

});

var port = process.argv[2]-0 || 3000;
app.listen(port);
console.log("server start - port:" + port);
console.log(" => http://localhost:"+port)
