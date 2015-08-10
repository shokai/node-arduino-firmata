arduino-firmata
===============
Arduino Firmata protocol (http://firmata.org) implementation on Node.js.

- Firmata is a protocol to controll Arduino from software on PC.
- You can embed Arduino code into Node.js application.
- Support sharing an Arduino between multiple processes.
- https://github.com/shokai/node-arduino-firmata
- https://npmjs.org/package/arduino-firmata


Install
-------

    % npm install arduino-firmata


Requirements
------------

* Arduino (http://arduino.cc)
  * testing with
    * Arduino Diecimila
    * Arduino Duemillanove
    * Arduino UNO
    * Arduino Leonardo
    * Arduino Micro
    * Seeduino v2
* Arduino Standard Firmata v2.2
  * Arduino IDE -> [File] -> [Examples] -> [Firmata] -> [StandardFirmata]


Usage
-----

### Samples

- https://github.com/shokai/node-arduino-firmata/tree/master/samples

### Setup

Connect
```javascript
var ArduinoFirmata = require('arduino-firmata');
var arduino = new ArduinoFirmata();

arduino.connect(); // use default arduino
arduino.connect('/dev/tty.usb-device-name');

arduino.on('connect', function(){

  console.log("board version"+arduino.boardVersion);
  // your-code-here

});
```

Reset
```javascript
arduino.reset(callback);
```

Close
```javascript
arduino.close(callback);
```


### I/O

Digital Write
```javascript
arduino.digitalWrite(13, true, callback);
arduino.digitalWrite(13, false, callback);
```

Digital Read
```javascript
arduino.pinMode(7, ArduinoFirmata.INPUT);
console.log( arduino.digitalRead(7) ); // => true/false
```

Digital Read (event)
```javascript
arduino.pinMode(7, ArduinoFirmata.INPUT);

arduino.on('digitalChange', function(e){
  console.log("pin" + e.pin + " : " + e.old_value + " -> " + e.value);
});
```

Analog Write (PWM)
```
setInterval(function(){
  var an = Math.random()*255; // 0 ~ 255
  arduino.analogWrite(9, an, callback);
}, 100);
```

Analog Read
```javascript
console.log( arduino.analogRead(0) ); // => 0 ~ 1023
```

Analog Read (event)
```javascript
arduino.on('analogChange', function(e){
  console.log("pin" + e.pin + " : " + e.old_value + " -> " + e.value);
});
```

Servo Motor
```javascript
setInterval(function(){
  var angle = Math.random()*180; // 0 ~ 180
  arduino.servoWrite(11, angle, callback);
}, 1000);
```

### Sysex

- http://firmata.org/wiki/V2.1ProtocolDetails#Sysex_Message_Format
- https://github.com/shokai/node-arduino-firmata/tree/master/samples/sysex

Send
```javascript
arduino.sysex(0x01, [13, 5, 2], callback);  // command, data_array, callback
```

Register Sysex Event
```javascript
arduino.on('sysex', function(e){
  console.log("command : " + e.command);
  console.log(e.data);
});
```


Develop
-------

    % npm install
    % npm run build
    # or
    % npm run watch

Test
----

### Install SysexLedBlinkFirmata into Arduino

* https://github.com/shokai/node-arduino-firmata/blob/master/samples/sysex/StandardFirmataWithLedBlink/StandardFirmataWithLedBlink.ino


### Run Test

    % npm test


Contributing
------------
1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
