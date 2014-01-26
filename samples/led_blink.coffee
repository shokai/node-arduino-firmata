ArduinoFirmata = require('../')
## arduino = require('arduino-firmata')

arduino = new ArduinoFirmata().connect()

arduino.on 'connect', ->
  console.log "connect!! #{arduino.serialport_name}"

  stat = true
  setInterval ->
    console.log stat
    arduino.digitalWrite 13, stat
    arduino.digitalWrite 12, !stat
    stat = !stat  ## blink
  , 300
