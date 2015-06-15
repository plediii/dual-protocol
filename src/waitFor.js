/*jslint node: true */
/* global -Promise */
"use strict";

var Promise = require('bluebird');
var _ = require('lodash');

module.exports = function (Domain) {
    Domain.prototype.waitFor = function (route, options) {
        var _this = this;
        var domain = _this;
        options = _.defaults({}, options, {
            timeout: 0
        });
        return new Promise(function (resolve, reject) {
            var timer;
            var receiver = function (body, ctxt) {
                if (timer) {
                    clearTimeout(timer);
                }
                resolve(new _this.Message(ctxt));
            };
            domain.once(route, receiver);
            if (options.timeout > 0) {
                timer = setTimeout(function () {
                    domain.removeListener(route, receiver);
                    reject(false);
                }, 1000 * options.timeout);
            }
        });
    };
};
