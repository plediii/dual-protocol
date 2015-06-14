/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('lodash');

module.exports = function (Domain) {
    Domain.prototype.send = function (to, from, body, options) {
        var _this = this;
        if (!to || to.length < 1) {
            return;
        }
        return _this.emit(to, body, new _this.Message({
            domain: _this
            , to: to
            , from: from
            , body: body
            , options: options
        }));
    };
};
