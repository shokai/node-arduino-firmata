var ArduinoFirmata = require(__dirname+'/../');
// var ArduinoFirmata = require('arduino-firmata');

var arduino = new ArduinoFirmata().connect();

arduino.on('connect', function(){
  console.log("connect!! "+arduino.serialport_name);
  console.log("board version: "+arduino.boardVersion);

  setInterval(function(){
    var an = arduino.analogRead(0);
    console.log(an);
  }, 300);
});
