/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('lodash');
var assert = require('assert');

var dualproto = require('../index');

describe('dualproto', function () {
    
    describe('Message', function () {

        it('should provide defaults for each dual-protocol parameter except body', function () {
            var ctxt = new dualproto.Message({});            
            assert.deepEqual(ctxt.to, []);
            assert.deepEqual(ctxt.from, []);
            assert(_.isObject(ctxt.options));
            assert(_.isUndefined(ctxt.body));
        });

        it('should consist of only dual message in toJSON', function () {
            var ctxt = new dualproto.Message({
                domain: { twenty: 'years'}
                , to: ['vice', 'president']
                , from: ['senate']
                , body: { maybe: 'house' }
                , options: { punching: 'bag' }
            });      
            var json = ctxt.toJSON();
            var jsonKeys = _.keys(json);
            assert.equal(4, jsonKeys.length);
            assert.deepEqual(json.to, ['vice', 'president']);
            assert.deepEqual(json.from, ['senate']);
            assert.equal(json.body.maybe, 'house');
            assert.equal(json.options.punching, 'bag');
        });

        describe('.parent', function (ctxt) {

            it('should return the route up to destination', function () {
                var ctxt = new dualproto.Message({
                    to: ['play', 'him', 'off']
                });
                assert.deepEqual(ctxt.parent(), ['play', 'him']);
            });

            it('should be trivial if parent(0)', function () {
                var ctxt = new dualproto.Message({
                    to: ['play', 'him', 'off']
                });
                assert.deepEqual(ctxt.parent(0), ['play', 'him', 'off']);
            });

            it('should return the parent parent when given 2', function () {
                var ctxt = new dualproto.Message({
                    to: ['play', 'him', 'off']
                });
                assert.deepEqual(ctxt.parent(2), ['play']);
            });

            it('should throw exception when given parent depth greater than destination', function () {
                var ctxt = new dualproto.Message({
                    to: ['play', 'him', 'off']
                });
                assert.throws(function () {
                    ctxt.parent(4);
                });
            });

        });

    });

});
