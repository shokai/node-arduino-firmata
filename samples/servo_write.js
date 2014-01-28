var ArduinoFirmata = require(__dirname+'/../');
// var ArduinoFirmata = require('arduino-firmata');

var arduino = new ArduinoFirmata().connect();

arduino.on('connect', function(){
  console.log("connect!! "+arduino.serialport_name);
  console.log("board version: "+arduino.boardVersion);

  setInterval(function(){
    var angle = Math.random()*180;
    console.log("servo write 9 pin : " + angle);
    arduino.servoWrite(9, angle);
  }, 1000);
});
