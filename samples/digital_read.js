var ArduinoFirmata = require(__dirname+'/../');
// var ArduinoFirmata = require('arduino-firmata');

var arduino = new ArduinoFirmata().connect();

arduino.on('connect', function(){
  console.log("connect!! "+arduino.serialport_name);
  console.log("board version: "+arduino.boardVersion);

  setInterval(function(){
    arduino.pinMode(7, ArduinoFirmata.INPUT);
    var pin_stat = arduino.digitalRead(7);
    console.log("pin 7 -> "+pin_stat);
  }, 100);
});
