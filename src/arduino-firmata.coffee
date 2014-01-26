events = require('eventemitter2')
fs = require 'fs'
SerialPort = require('serialport').SerialPort

module.exports = class ArduinoFirmata extends events.EventEmitter2

  @Status = {
    CLOSE: 0
    OPEN: 1
  }

  @INPUT  = 0
  @OUTPUT = 1
  @ANALOG = 2
  @PWM    = 3
  @SERVO  = 4
  @SHIFT  = 5
  @I2C    = 6
  @LOW    = 0
  @HIGH   = 1

  @MAX_DATA_BYTES  = 32
  @DIGITAL_MESSAGE = 0x90 # send data for a digital port
  @ANALOG_MESSAGE  = 0xE0 # send data for an analog pin (or PWM)
  @REPORT_ANALOG   = 0xC0 # enable analog input by pin
  @REPORT_DIGITAL  = 0xD0 # enable digital input by port
  @SET_PIN_MODE    = 0xF4 # set a pin to INPUT/OUTPUT/PWM/etc
  @REPORT_VERSION  = 0xF9 # report firmware version
  @SYSTEM_RESET    = 0xFF # reset from MIDI
  @START_SYSEX     = 0xF0 # start a MIDI SysEx message
  @END_SYSEX       = 0xF7 # end a MIDI SysEx message

  @list: (callback) ->
    fs.readdir '/dev', (err, files) ->
      callback(err) if err
      devices = []
      for i in files
        devices.push "/dev/#{i}" if i.match(/tty\.?(usb|acm)/i)
      callback(null, devices)

  constructor: ->
    @wait_for_data = 0
    @execute_multi_byte_command = 0
    @multi_byte_channel = 0
    @stored_input_data = []
    @parsing_sysex = false
    @sysex_byte_read = 0
    @digital_output_data = [0,0,0,0,0,0,0,0,  0,0,0,0,0,0,0,0]
    @digital_input_data = [0,0,0,0,0,0,0,0,  0,0,0,0,0,0,0,0]
    @analog_input_data = [0,0,0,0,0,0,0,0,  0,0,0,0,0,0,0,0]
    @version = null
    @status = ArduinoFirmata.Status.CLOSE

  connect: (@serialport_name, opts={baudrate: 57600}) ->
    opts.parser = require('serialport').parsers.raw
    unless @serialport_name
      ArduinoFirmata.list (err, devices) =>
        @connect(devices[0], opts)
      return @
    @serialport = new SerialPort @serialport_name, opts
    @serialport.on 'open', =>
      @status = ArduinoFirmata.Status.OPEN
      @emit 'connect'
      @serialport.on 'data', (data) =>
        for byte in data
          @process_input byte
    return @

  isOpen: ->
    return @status == ArduinoFirmata.Status.OPEN

  write: (byte) ->
    @serialport.write [byte]

  pinMode: (pin, mode) ->
    @write ArduinoFirmata.SET_PIN_MODE
    @write pin
    switch mode
      when true
        mode = ArduinoFirmata.OUTPUT
      when false
        mode = retuArduinoFirmata.INPUT
    @write mode

  digitalWrite: (pin, value) ->
    @pinMode pin, ArduinoFirmata.OUTPUT
    port_num = (pin >>> 3) & 0x0F
    if value == 0 or value == false
      @digital_output_data[port_num] &= ~(1 << (pin & 0x07))
    else
      @digital_output_data[port_num] |= (1 << (pin & 0x07))
    @write(ArduinoFirmata.DIGITAL_MESSAGE | port_num)
    @write(@digital_output_data[port_num] & 0x7F)
    @write(@digital_output_data[port_num] >>> 7)

  process_input: (byte) ->
    if @parsing_sysex
    else if @wait_for_data > 0 and input_data < 128
      @wait_for_data -= 1
      @stored_input_data[@wait_for_data] = input_data
    else
