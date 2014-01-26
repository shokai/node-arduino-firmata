events = require('eventemitter2')
fs = require 'fs'
SerialPort = require('serialport').SerialPort
debug = require('debug')('arduino-firmata')

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
      for f in files
        devices.push "/dev/#{f}" if f.match(/tty\.?(usb|acm)/i)
      callback(null, devices)

  constructor: ->
    @status = ArduinoFirmata.Status.CLOSE
    @wait_for_data = 0
    @execute_multi_byte_command = 0
    @multi_byte_channel = 0
    @stored_input_data = []
    @parsing_sysex = false
    @sysex_bytes_read = 0
    @digital_output_data = [0,0,0,0,0,0,0,0,  0,0,0,0,0,0,0,0]
    @digital_input_data = [0,0,0,0,0,0,0,0,  0,0,0,0,0,0,0,0]
    @analog_input_data = [0,0,0,0,0,0,0,0,  0,0,0,0,0,0,0,0]
    @boardVersion = null

  connect: (@serialport_name, opts={baudrate: 57600}) ->
    opts.parser = require('serialport').parsers.raw
    unless @serialport_name
      ArduinoFirmata.list (err, devices) =>
        @connect(devices[0], opts)
      return @

    @once 'connect', ->
      for i in [0...6]
        @write(ArduinoFirmata.REPORT_ANALOG | i)
        @write 1
      for i in [0...2]
        @write(ArduinoFirmata.REPORT_DIGITAL | i)
        @write 1

    @serialport = new SerialPort @serialport_name, opts
    @serialport.once 'open', =>
      cid = setInterval =>
        debug 'request REPORT_VERSION'
        @write ArduinoFirmata.REPORT_VERSION
      , 500
      @status = ArduinoFirmata.Status.OPEN
      @once 'boardVersion', (version) =>
        clearInterval cid
        @emit 'connect'
      @serialport.on 'data', (data) =>
        for byte in data
          @process_input byte

    return @

  isOpen: ->
    return @status is ArduinoFirmata.Status.OPEN

  write: (byte) ->
    @serialport.write [byte]

  pinMode: (pin, mode) ->
    @write ArduinoFirmata.SET_PIN_MODE
    @write pin
    switch mode
      when true
        mode = ArduinoFirmata.OUTPUT
      when false
        mode = ArduinoFirmata.INPUT
    @write mode

  digitalWrite: (pin, value) ->
    @pinMode pin, ArduinoFirmata.OUTPUT
    port_num = (pin >>> 3) & 0x0F
    if value is 0 or value is false
      @digital_output_data[port_num] &= ~(1 << (pin & 0x07))
    else
      @digital_output_data[port_num] |= (1 << (pin & 0x07))
    @write(ArduinoFirmata.DIGITAL_MESSAGE | port_num)
    @write(@digital_output_data[port_num] & 0x7F)
    @write(@digital_output_data[port_num] >>> 7)

  digitalRead: (pin) ->
    return (@digital_input_data[pin >>> 3] >>> (pin & 0x07)) & 0x01 > 0

  analogRead: (pin) ->
    return @analog_input_data[pin]

  process_input: (input_data) ->
    if @parsing_sysex
      if input_data is ArduinoFirmata.END_SYSEX
        @parsing_sysex = false
        sysex_command = @stored_input_data[0]
        sysex_data = @stored_input_data[1...@sysex_bytes_read]
        @emit 'sysex', sysex_command, sysex_data
      else
        @stored_input_data[@sysex_bytes_read] = input_data
        @sysex_bytes_read += 1
    else if @wait_for_data > 0 and input_data < 128
      @wait_for_data -= 1
      @stored_input_data[@wait_for_data] = input_data
      if @execute_multi_byte_command isnt 0 and @wait_for_data is 0
        switch @execute_multi_byte_command
          when ArduinoFirmata.DIGITAL_MESSAGE
            input_data = (@stored_input_data[0] << 7) + @stored_input_data[1]
            @digital_input_data[@multi_byte_channel] = input_data
          when ArduinoFirmata.ANALOG_MESSAGE
            analog_value = (@stored_input_data[0] << 7) + @stored_input_data[1]
            @analog_input_data[@multi_byte_channel] = analog_value
          when ArduinoFirmata.REPORT_VERSION
            @boardVersion = "#{@stored_input_data[1]}.#{@stored_input_data[0]}"
            @emit 'boardVersion', @boardVersion
    else
      if input_data < 0xF0
        command = input_data & 0xF0
        @multi_byte_channel = input_data & 0x0F
      else
        command = input_data
      if command is ArduinoFirmata.START_SYSEX
        @parsing_sysex = true
        @sysex_bytes_read = 0
      else if command is ArduinoFirmata.DIGITAL_MESSAGE or
      command is ArduinoFirmata.ANALOG_MESSAGE or
      command is ArduinoFirmata.REPORT_VERSION
        @wait_for_data = 2
        @execute_multi_byte_command = command
      else
