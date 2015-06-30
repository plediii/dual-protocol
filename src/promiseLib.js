/*jslint node: true */
/* global -Promise */
"use strict";

module.exports = function (Domain, libs) {
    libs.Promise = require('./Promise');
};
