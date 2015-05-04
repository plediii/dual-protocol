/*jslint node: true */
"use strict";

var dualproto = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualproto', function () {

    describe('mount', function () {

        it('should return the domain', function (done) {
            var domain = dualproto();
            var x = domain
                .mount(['big'], function () {});
            assert.strictEqual(x, domain);
        });

        it('should be *NOT* be able to mount undefined', function (done) {
            // this is most likely an error on the user's part
            var domain = dualproto();
            assert.throws(function () {
                dual.mount([void 0], function () {});
            }, /undefined/);
        });

        it('should throw exception on empty mount destination', function () {
            var domain = dualproto();
            assert.throws(function () {
                dual.mount([], function () {});
            }, /empty/);
        });

    });

    describe('send', function () {

        it('should return promise value true when an event is matched', function (done) {
            var dual = dualproto();
            dual.mount(['food'], function () {});
            dual.send(['food'])
            .then(function (called) {
                assert(called);
                done();
            });
        });

        it('should return promise value false when an event is matched', function (done) {
            var dual = dualproto();
            dual.mount(['food'], function () {});
            dual.send(['wad'])
            .then(function (called) {
                assert(!called);
                done();
            });
        });

    });
    
    describe('mounted host', function () {

        var dual = dualproto();
        
        it('should be triggered on target message', function (done) {
            dual.mount(['host'], function () {
                done();
            });
            dual.send(['host']);
        });

        it('should be removable via removeListener', function (done) {
            var removable = function () {
                done('should have been removed');
            };
            dual.mount(['guiness'], removable);
            dual.mount(['guiness'], function () {
                done();
            });
            dual.removeListener(['guiness'], removable);
            dual.send(['guiness']);
        });

        it('should be called with ctxt.to', function (done) {
            dual.mount(['hostA'], function (ctxt) {
                assert.deepEqual(ctxt.to, ['hostA']);
                done();
            });
            dual.send(['hostA']);
        });

        it('should be called with ctxt.from', function (done) {
            dual.mount(['hostB'], function (ctxt) {
                assert.deepEqual(ctxt.from, ['sourceA']);
                done();
            });
            dual.send(['hostB'], ['sourceA']);
        });

        it('should be called with undefined body when no body is provided', function (done) {
            dual.mount(['hostC'], function (ctxt) {
                assert(_.isUndefined(ctxt.body));
                done();
            });
            dual.send(['hostC'], ['sourceB']);
        });

        it('should be called with body when one is provided', function (done) {
            dual.mount(['hostD'], function (ctxt) {
                assert.deepEqual(ctxt.body, {a: 1});
                done();
            });
            dual.send(['hostD'], [], {a: 1});
        });

        it('should be called with options even when not provided', function (done) {
            dual.mount(['hostD'], function (ctxt) {
                assert(_.isObject(ctxt.options));
                done();
            });
            dual.send(['hostD'], [], {a: 1});
        });

        it('should be called with provided options', function (done) {
            dual.mount(['hostD'], function (ctxt) {
                assert.deepEqual(ctxt.options, {a: 1});
                done();
            });
            dual.send(['hostD'], [], {a: 1}, {a: 2});
        });

        it('should NOT be triggered on target message for other hosts', function (done) {
            var received = 0;
            dual.mount(['hostE'], function () {
                received++;
            });
            dual.mount(['host1'], function () {
                assert.equal(received, 0);
                received++;
                done();
            });

            dual.send(['host1']);
        });

    });

    describe('mounted tree', function () {

        var dual = dualproto();

        it('should be possible to mount hosts in a tree structure', function (done) {
            dual.mount([], {
                host: function () {
                    done();
                }
            });
            dual.send(['host']);
        });

        it('should be possible to mount host trees directly', function (done) {
            dual.mount({
                go: function () {
                    done();
                }
            });
            dual.send(['go']);
        });


        it('should be possible to mount hosts in a tree structure below a static trunk', function (done) {
            dual.mount(['cookie'], {
                sword: function () {
                    done();
                }
            });
            dual.send(['cookie', 'sword']);
        });

        it('should be possible to mount deep tree structure', function (done) {
            dual.mount([], {
                treat: {
                    grass: function () {
                        done();
                    }
                }
            });
            dual.send(['treat', 'grass']);
        });

        it('should be possible to mount deep tree structure under a static root', function (done) {
            dual.mount(['phew'], {
                come: {
                    around: function () {
                        done();
                    }
                }
            });
            dual.send(['phew', 'come', 'around']);
        });

        it('should be possible to mount multiple deep tree structures', function (done) {
            var called = [];
            dual.mount([], {
                huh: {
                    pizza: function () {
                        called.push('pizza');
                    }
                }
                , no: {
                    more: function () {
                        assert.deepEqual(called, ['pizza']);
                        done();
                    }
                }
            });

            dual.send(['huh', 'pizza']);
            dual.send(['no', 'more']);
        });

        it('should be possible to mount array', function (done) {
            var called = [];
            dual.mount(['yeah'], [
                function () {
                    called.push('dragon');
                }
                , function () {
                    called.push('drag-on');
                }
            ]);

            dual.send(['yeah']).then(function () {
                assert.deepEqual(['dragon', 'drag-on'], called);
                done();
            });
        });

        it('should be possible to mount nested array', function (done) {
            var called = [];
            dual.mount([], {
                juicy: {
                    apple:[
                        function () {
                            called.push('no');
                        }
                        , function () {
                            called.push('acceptable');
                        }
                    ]
                }
            });

            dual.send(['juicy', 'apple']).then(function () {
                assert.deepEqual(['no', 'acceptable'], called);
                done();
            });
        });

    });

});
