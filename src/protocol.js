/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('lodash');
var inherits = require('inherits');

var Message = require('./message');
var Domain = require('./domain');

var makeConstructor = function (Domain) {
    var constructor = function (options) {
        return new Domain(options);
    };

    constructor.use = function (extender) {

        var NewDomain = function (options) {
            Domain.call(this, options);
        };
        inherits(NewDomain, Domain);

        var Message = Domain.prototype.Message;
        var NewMessage = function (options) {
            Message.call(this, options);
        };
        inherits(NewMessage, Message);
        NewDomain.prototype.Message = NewMessage;

        extender(NewDomain)
        return makeConstructor(NewDomain);
    };
    return constructor;
};

Domain.prototype.Message = Message;

require('./mount')(Domain);
require('./unmount')(Domain);
require('./send')(Domain);
require('./uid')(Domain);
require('./waitFor')(Domain);

module.exports = makeConstructor(Domain)


