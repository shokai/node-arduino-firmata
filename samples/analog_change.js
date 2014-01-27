var ArduinoFirmata = require(__dirname+'/../');
// var ArduinoFirmata = require('arduino-firmata');

var arduino = new ArduinoFirmata().connect();

arduino.on('connect', function(){
  console.log("connect!! "+arduino.serialport_name);
  console.log("board version: "+arduino.boardVersion);

  arduino.on('analogChange', function(e){
    if(e.pin != 0) return;
    console.log("pin" + e.pin + " : " + e.old_value + " -> " + e.value);
  });
});
