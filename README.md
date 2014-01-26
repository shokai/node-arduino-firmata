arduino-firmata
===============
Arduino Firmata protocol (http://firmata.org) implementation on Node.js.

- Firmata is a protocol to controll Arduino from software on PC.
- You can embed Arduino code into Node.js application.
- Support sharing an Arduino between multiple processes.
- https://github.com/shokai/node-arduino-firmata
- https://npmjs.org/package/arduino-firmata


## Install

    % npm install arduino-firmata


## Requirements
* Arduino (http://arduino.cc)
  * testing with Arduino UNO, Leonardo and Micro.
* Arduino Standard Firmata v2.2
  * Arduino IDE -> [File] -> [Examples] -> [Firmata] -> [StandardFirmata]


## Usage

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


Close
```javascript
arduino.close(callback);
```


### I/O

Digital Write
```javascript
arduino.digitalWrite(13, true);
arduino.digitalWrite(13, false);
```

Digital Read
```javascript
arduino.pinMode(7, ArduinoFirmata.INPUT);
console.log( arduino.digitalRead(7) ); // => true/false
```

Analog Write (PWM)
```
setInterval(function(){
  var an = Math.random()*255;
  arduino.analogWrite(9, an);
}, 100);
```

Analog Read
```javascript
console.log( arduino.analogRead(0) ); // => 0 ~ 1023
```

Servo Motor
```javascript
setInterval(function(){
  var angle = Math.random()*180;
  arduino.analogWrite(11, angle);
}, 1000);
```


## Test

    % npm install

connect firmata installed Arduino board, then

    % grunt test


Contributing
------------
1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
