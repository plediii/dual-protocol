/*jslint node: true */
"use strict";

var dualproto = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualproto', function () {

    describe('double star wild cards', function () {

        var dual = dualproto();
        
        it('should be host mount points', function (done) {
            dual.mount(['toowild', '**'], function () {
                done();
            });
            dual.send(['toowild', 'whatever']);
        });

        it('*should* receive from longer destinations', function (done) {
            dual.mount(['toowild1', '**'], function () {
                done();
            });
            dual.send(['toowild1', 'whatever', 'whatever2']);
        });

        it('*should* receive from shorter destinations', function (done) {
            dual.mount(['toowild2', '**'], function () {
                done();
            });
            dual.send(['toowild2']);
        });

        it('should *not* receive from even shorter destinations', function (done) {
            dual.mount(['did', 'toowild2', '**'], function () {
                done();
            });
            dual.send(['did']);
            dual.send(['did', 'toowild2']);
        });

        it('should receive full destination in message', function (done) {
            dual.mount(['toowild3', '**'], function (ctxt) {
                assert.deepEqual(ctxt.to, ['toowild3', 'rabbit']);
                done();
            });
            dual.send(['toowild3', 'rabbit']);
        });

    });

});
