(function() {
  var ArduinoFirmata, SerialPort, events, fs,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  events = require('eventemitter2');

  fs = require('fs');

  SerialPort = require('serialport').SerialPort;

  module.exports = ArduinoFirmata = (function(_super) {
    __extends(ArduinoFirmata, _super);

    ArduinoFirmata.Status = {
      CLOSE: 0,
      OPEN: 1
    };

    ArduinoFirmata.INPUT = 0;

    ArduinoFirmata.OUTPUT = 1;

    ArduinoFirmata.ANALOG = 2;

    ArduinoFirmata.PWM = 3;

    ArduinoFirmata.SERVO = 4;

    ArduinoFirmata.SHIFT = 5;

    ArduinoFirmata.I2C = 6;

    ArduinoFirmata.LOW = 0;

    ArduinoFirmata.HIGH = 1;

    ArduinoFirmata.MAX_DATA_BYTES = 32;

    ArduinoFirmata.DIGITAL_MESSAGE = 0x90;

    ArduinoFirmata.ANALOG_MESSAGE = 0xE0;

    ArduinoFirmata.REPORT_ANALOG = 0xC0;

    ArduinoFirmata.REPORT_DIGITAL = 0xD0;

    ArduinoFirmata.SET_PIN_MODE = 0xF4;

    ArduinoFirmata.REPORT_VERSION = 0xF9;

    ArduinoFirmata.SYSTEM_RESET = 0xFF;

    ArduinoFirmata.START_SYSEX = 0xF0;

    ArduinoFirmata.END_SYSEX = 0xF7;

    ArduinoFirmata.list = function(callback) {
      return fs.readdir('/dev', function(err, files) {
        var devices, i, _i, _len;
        if (err) {
          callback(err);
        }
        devices = [];
        for (_i = 0, _len = files.length; _i < _len; _i++) {
          i = files[_i];
          if (i.match(/tty\.?(usb|acm)/i)) {
            devices.push("/dev/" + i);
          }
        }
        return callback(null, devices);
      });
    };

    function ArduinoFirmata() {
      this.wait_for_data = 0;
      this.execute_multi_byte_command = 0;
      this.multi_byte_channel = 0;
      this.stored_input_data = [];
      this.parsing_sysex = false;
      this.sysex_byte_read = 0;
      this.digital_output_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.digital_input_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.analog_input_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.version = null;
      this.status = ArduinoFirmata.Status.CLOSE;
    }

    ArduinoFirmata.prototype.connect = function(serialport_name, opts) {
      var _this = this;
      this.serialport_name = serialport_name;
      if (opts == null) {
        opts = {
          baudrate: 57600
        };
      }
      opts.parser = require('serialport').parsers.raw;
      if (!this.serialport_name) {
        ArduinoFirmata.list(function(err, devices) {
          return _this.connect(devices[0], opts);
        });
        return this;
      }
      this.serialport = new SerialPort(this.serialport_name, opts);
      this.serialport.on('open', function() {
        _this.status = ArduinoFirmata.Status.OPEN;
        _this.emit('connect');
        return _this.serialport.on('data', function(data) {
          var byte, _i, _len, _results;
          _results = [];
          for (_i = 0, _len = data.length; _i < _len; _i++) {
            byte = data[_i];
            _results.push(_this.process_input(byte));
          }
          return _results;
        });
      });
      return this;
    };

    ArduinoFirmata.prototype.isOpen = function() {
      return this.status === ArduinoFirmata.Status.OPEN;
    };

    ArduinoFirmata.prototype.write = function(byte) {
      return this.serialport.write([byte]);
    };

    ArduinoFirmata.prototype.pinMode = function(pin, mode) {
      this.write(ArduinoFirmata.SET_PIN_MODE);
      this.write(pin);
      switch (mode) {
        case true:
          mode = ArduinoFirmata.OUTPUT;
          break;
        case false:
          mode = retuArduinoFirmata.INPUT;
      }
      return this.write(mode);
    };

    ArduinoFirmata.prototype.digitalWrite = function(pin, value) {
      var port_num;
      this.pinMode(pin, ArduinoFirmata.OUTPUT);
      port_num = (pin >>> 3) & 0x0F;
      if (value === 0 || value === false) {
        this.digital_output_data[port_num] &= ~(1 << (pin & 0x07));
      } else {
        this.digital_output_data[port_num] |= 1 << (pin & 0x07);
      }
      this.write(ArduinoFirmata.DIGITAL_MESSAGE | port_num);
      this.write(this.digital_output_data[port_num] & 0x7F);
      return this.write(this.digital_output_data[port_num] >>> 7);
    };

    ArduinoFirmata.prototype.process_input = function(byte) {
      if (this.parsing_sysex) {

      } else if (this.wait_for_data > 0 && input_data < 128) {
        this.wait_for_data -= 1;
        return this.stored_input_data[this.wait_for_data] = input_data;
      } else {

      }
    };

    return ArduinoFirmata;

  })(events.EventEmitter2);

}).call(this);
