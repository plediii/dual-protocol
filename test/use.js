/*jslint node: true */
"use strict";

var dualproto = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualproto', function () {
    
    describe('use', function () {

        it('should allow adding functions to Domain prototype', function (done) {
            var api = dualproto.use(function (proto) {
                proto.Domain.prototype.cutout = function () {
                    done();
                };
            });
            api().cutout();
        });

        it('should allow adding functions to Message prototype', function (done) {
            var api = dualproto.use(function (proto) {
                proto.Message.prototype.cutout = function () {
                    done();
                };
            });
            var domain = api(); 
            domain.mount(['hey'], function (ctxt) {
                ctxt.cutout();
            });
        });

    });

});
