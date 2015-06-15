/*jslint node: true */
/* global -Promise */
"use strict";

var HevEmitter = require('hevemitter').EventEmitter;
var inherits = require('inherits');

var Domain = module.exports = function (options) {
    HevEmitter.call(this, options);
};

inherits(Domain, HevEmitter);
