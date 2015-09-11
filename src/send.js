/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('./lodash');

var tryEmit = function (domain, to, body, msg) {
    try {
        return domain.emit(to, body, msg);
    } catch (ex) {
        console.error('Uncaught send exception: ', ex, ex.stack);
        return true;
    }
};

module.exports = function (Domain) {
    Domain.prototype.send = function (to, from, body, options) {
        var _this = this;
        var msg;
        if (_.isArray(to) || _.isString(to)) {
            msg = new _this.Message({
                domain: _this
                , to: to
                , from: from
                , body: body
                , options: options
            });
        } else {
            msg = new _this.Message(_.extend({}, to, {
                domain: _this
            }));
        }
        if (!msg.to || msg.to.length < 1) {
            return void 0;
        }
        return tryEmit(this, msg.to, msg.body, msg);
    };

    Domain.prototype.Message.prototype.send = function () {
        var domain = this.domain;
        return domain.send.apply(domain, arguments);
    };
};
