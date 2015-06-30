/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('lodash');
var assert = require('assert');

var dualproto = require('../index');


describe('smoke test', function () {

    it('should be constructable', function () {
        dualproto();
    });

    it('should have "use" method', function () {
        assert(_.isFunction(dualproto.use));
    });

    it('should have "mount" method', function () {
        assert(_.isFunction(dualproto().mount));
    });

    it('should have "send" method', function () {
        assert(_.isFunction(dualproto().send));
    });

    it('should have "uid" method', function () {
        assert(_.isFunction(dualproto().uid));
    });

    it('should have "unmount" method', function () {
        assert(_.isFunction(dualproto().unmount));
    });

    it('should have "waitFor" method', function () {
        assert(_.isFunction(dualproto().waitFor));
    });

    it('use should expose lodash in libs', function (done) {
        dualproto.use(function (Domain, libs) {
            assert(libs.hasOwnProperty('_'));
            done();
        });
    });

    it('use should expose bluebird in libs', function (done) {
        dualproto.use(function (Domain, libs) {
            assert(libs.hasOwnProperty('Promise'));
            done();
        });
    });

});
