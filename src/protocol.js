/*jslint node: true */
/* global -Promise */
"use strict";

var inherits = require('inherits');

var Message = require('./message');
var Domain = require('./domain');
var _ = require('./lodash');

var makeConstructor = function (Domain, libs) {
    var constructor = function (options) {
        return new Domain(options);
    };

    constructor.use = function (extender) {
        var newLibs = _.clone(libs);
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

        extender(NewDomain, newLibs);
        return makeConstructor(NewDomain, newLibs);
    };
    return constructor;
};

Domain.prototype.Message = Message;

require('./mount')(Domain);
require('./send')(Domain);
require('./uid')(Domain);
require('./unmount')(Domain);
require('./waitFor')(Domain);


module.exports = makeConstructor(Domain, {})
.use(require('./lodashLib'))
.use(require('./promiseLib'))
.use(require('./mount'))
.use(require('./send'))
.use(require('./uid'))
.use(require('./unmount'))
.use(require('./waitFor'));



