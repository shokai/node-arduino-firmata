(function() {
  var ArduinoFirmata, SerialPort, debug, events, fs,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  events = require('eventemitter2');

  fs = require('fs');

  SerialPort = require('serialport').SerialPort;

  debug = require('debug')('arduino-firmata');

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
        var devices, f, _i, _len;
        if (err) {
          callback(err);
        }
        devices = [];
        for (_i = 0, _len = files.length; _i < _len; _i++) {
          f = files[_i];
          if (f.match(/tty\.?(usb|acm)/i)) {
            devices.push("/dev/" + f);
          }
        }
        return callback(null, devices);
      });
    };

    function ArduinoFirmata() {
      this.status = ArduinoFirmata.Status.CLOSE;
      this.wait_for_data = 0;
      this.execute_multi_byte_command = 0;
      this.multi_byte_channel = 0;
      this.stored_input_data = [];
      this.parsing_sysex = false;
      this.sysex_bytes_read = 0;
      this.digital_output_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.digital_input_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.analog_input_data = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      this.boardVersion = null;
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
      this.once('connect', function() {
        var i, _i, _j, _results;
        for (i = _i = 0; _i < 6; i = ++_i) {
          this.write(ArduinoFirmata.REPORT_ANALOG | i);
          this.write(1);
        }
        _results = [];
        for (i = _j = 0; _j < 2; i = ++_j) {
          this.write(ArduinoFirmata.REPORT_DIGITAL | i);
          _results.push(this.write(1));
        }
        return _results;
      });
      this.serialport = new SerialPort(this.serialport_name, opts);
      this.serialport.once('open', function() {
        var cid;
        cid = setInterval(function() {
          debug('request REPORT_VERSION');
          return _this.write(ArduinoFirmata.REPORT_VERSION);
        }, 500);
        _this.status = ArduinoFirmata.Status.OPEN;
        _this.once('boardVersion', function(version) {
          clearInterval(cid);
          return _this.emit('connect');
        });
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
          mode = ArduinoFirmata.INPUT;
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

    ArduinoFirmata.prototype.digitalRead = function(pin) {
      return (this.digital_input_data[pin >>> 3] >>> (pin & 0x07)) & 0x01 > 0;
    };

    ArduinoFirmata.prototype.analogRead = function(pin) {
      return this.analog_input_data[pin];
    };

    ArduinoFirmata.prototype.process_input = function(input_data) {
      var analog_value, command, sysex_command, sysex_data;
      if (this.parsing_sysex) {
        if (input_data === ArduinoFirmata.END_SYSEX) {
          this.parsing_sysex = false;
          sysex_command = this.stored_input_data[0];
          sysex_data = this.stored_input_data.slice(1, this.sysex_bytes_read);
          return this.emit('sysex', sysex_command, sysex_data);
        } else {
          this.stored_input_data[this.sysex_bytes_read] = input_data;
          return this.sysex_bytes_read += 1;
        }
      } else if (this.wait_for_data > 0 && input_data < 128) {
        this.wait_for_data -= 1;
        this.stored_input_data[this.wait_for_data] = input_data;
        if (this.execute_multi_byte_command !== 0 && this.wait_for_data === 0) {
          switch (this.execute_multi_byte_command) {
            case ArduinoFirmata.DIGITAL_MESSAGE:
              input_data = (this.stored_input_data[0] << 7) + this.stored_input_data[1];
              return this.digital_input_data[this.multi_byte_channel] = input_data;
            case ArduinoFirmata.ANALOG_MESSAGE:
              analog_value = (this.stored_input_data[0] << 7) + this.stored_input_data[1];
              return this.analog_input_data[this.multi_byte_channel] = analog_value;
            case ArduinoFirmata.REPORT_VERSION:
              this.boardVersion = "" + this.stored_input_data[1] + "." + this.stored_input_data[0];
              return this.emit('boardVersion', this.boardVersion);
          }
        }
      } else {
        if (input_data < 0xF0) {
          command = input_data & 0xF0;
          this.multi_byte_channel = input_data & 0x0F;
        } else {
          command = input_data;
        }
        if (command === ArduinoFirmata.START_SYSEX) {
          this.parsing_sysex = true;
          return this.sysex_bytes_read = 0;
        } else if (command === ArduinoFirmata.DIGITAL_MESSAGE || command === ArduinoFirmata.ANALOG_MESSAGE || command === ArduinoFirmata.REPORT_VERSION) {
          this.wait_for_data = 2;
          return this.execute_multi_byte_command = command;
        } else {

        }
      }
    };

    return ArduinoFirmata;

  })(events.EventEmitter2);

}).call(this);
