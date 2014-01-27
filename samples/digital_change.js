var ArduinoFirmata = require(__dirname+'/../');
// var ArduinoFirmata = require('arduino-firmata');

var arduino = new ArduinoFirmata().connect();

arduino.on('connect', function(){
  console.log("connect!! "+arduino.serialport_name);
  console.log("board version: "+arduino.boardVersion);

  arduino.pinMode(7, ArduinoFirmata.INPUT);
  arduino.on('digitalChange', function(e){
    console.log("pin" + e.pin + " : " + e.old_value + " -> " + e.value);
  });

});
