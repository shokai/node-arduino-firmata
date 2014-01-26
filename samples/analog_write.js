var ArduinoFirmata = require(__dirname+'/../');
// var ArduinoFirmata = require('arduino-firmata');

var arduino = new ArduinoFirmata().connect();

arduino.on('connect', function(){
  console.log("connect!! "+arduino.serialport_name);
  console.log("board version: "+arduino.boardVersion);

  setInterval(function(){
    var an = Math.random()*255;
    console.log("analog write 9 pin : " + an);
    arduino.analogWrite(9, an);
  }, 100);
});
