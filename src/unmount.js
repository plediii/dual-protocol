/*jslint node: true */
/* global -Promise */
"use strict";

module.exports = function (Domain) {
    Domain.prototype.unmount = function (point) {
        var _this = this;
        _this.removeAllListeners(point);
        _this.removeAllListeners(point.concat('**'));
    };
};
