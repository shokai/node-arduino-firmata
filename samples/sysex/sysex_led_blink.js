var ArduinoFirmata = require(__dirname+'/../../');
// var ArduinoFirmata = require('arduino-firmata');

var arduino = new ArduinoFirmata().connect();

arduino.on('connect', function(){
  arduino.sysex(0x01, [13, 5, 2]);  //  pin13, blink 5 times, 200 msec interval
  arduino.sysex(0x01, [12, 3, 10]); //  pin12, blink 3 times, 1000 msec interval
});

arduino.on('sysex', function(e){
  console.log("command : " + e.command);
  console.log("data    : " + JSON.stringify(e.data));
});
