/*jslint node: true */
"use strict";

var _ = require('lodash');
var assert = require('assert');

var dualproto = require('../index');
var Message = dualproto().Message;

describe('dualproto', function () {
    
    describe('waitfor', function () {

        var d;
        beforeEach(function () {
            d = dualproto();
        });

        it('should resolve when target route emitted', function (done) {
            d.waitFor(['lockersearch'])
            .then(function () {
                done();
            })
            .catch(function (err) {
                done(err || 'waitFor rejected');
            });
            d.send(['lockersearch']);
        });

        it('should not leak listeners when resolved', function (done) {
            var initial = d.listeners('**').length;
            d.waitFor(['lockersearch'])
            .then(function () {
                assert.equal(initial, d.listeners('**').length);
                done();
            })
            .catch(function (err) {
                done(err || 'waitFor rejected');
            });
            d.send(['lockersearch']);
        });


        it('should be able to trigger time limited waitfor', function (done) {
            var start = Date.now();
            d.waitFor(['lockersearch'], { timeout: 0.100 })
            .then(function () {
                done();
            })
            .catch(function (err) {
                return done(err);
            });
            d.send(['lockersearch']);
        });

        it('should reject after timeout interval when given timeout option (100)', function (done) {
            var start = Date.now();
            d.waitFor(['lockersearch'], { timeout: 0.100 })
            .catch(function (err) {
                if (err) {
                    return done(err);
                }
                var delta = Date.now() - start;
                assert(delta >= 100);
                assert(delta < 200);
                done();
            });
        });

        it('should reject after timeout interval when given timeout option (200)', function (done) {
            var start = Date.now();
            d.waitFor(['lockersearch'], { timeout: 0.200 })
            .catch(function (err) {
                var delta = Date.now() - start;
                assert(delta >= 200);
                assert(delta < 300);
                done();
            });
        });

        it('should not leak listeners when timed out', function (done) {
            var initial = d.listeners('**').length;
            d.waitFor(['lockersearch'], { timeout: 0.100 })
            .catch(function (err) {
                assert.equal(initial, d.listeners('**').length);
                done();
            });
        });

        it('should resolve with dual context', function (done) {
            d.waitFor(['hi'])
            .then(function (ctxt) {
                assert.deepEqual(ctxt.to, ['hi']);
                assert.deepEqual(ctxt.from, ['owner']);
                assert.equal(ctxt.body.recreational, 'vehicle');
                assert.equal(ctxt.options.yo, 'appointment');
                assert(ctxt instanceof Message);
                done();
            })
            .catch(function (err) {
                done(err || 'waitfor reject');
            });
            d.send(['hi'], ['owner'], { recreational: 'vehicle'}, { yo: 'appointment'});
        });

    });

});
