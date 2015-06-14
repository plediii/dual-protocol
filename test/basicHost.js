/*jslint node: true */
"use strict";

var dualproto = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualproto', function () {
    
    var d;
    beforeEach(function () {
        d = dualproto();
    });

    describe('mount', function () {

        it('should return the domain', function () {
            var x = d.mount(['big'], function () {});
            assert.strictEqual(x, d);
        });

        it('should be *NOT* be able to mount undefined', function () {
            // this is most likely an error on the user's part
            assert.throws(function () {
                d.mount([void 0], function () {});
            }, /undefined/);
        });

        it('should throw exception on empty mount destination', function () {
            var d = dualproto();
            assert.throws(function () {
                d.mount([], function () {});
            }, /empty/);
        });

    });

    describe('send', function () {

        it('should return true when an event a host is matched', function () {
            d.mount(['food'], function () {});
            assert(d.send(['food']));
        });

        it('should return false when an event is *not* matched', function () {
            d.mount(['food'], function () {});
            assert(!d.send(['wad']));
        });

    });
    
    describe('mounted host', function () {

        it('should be triggered on target message', function (done) {
            d.mount(['host'], function () {
                done();
            });
            d.send(['host']);
        });

        it('should be removable via removeListener', function (done) {
            var removable = function () {
                done('should have been removed');
            };
            d.mount(['guiness'], removable);
            d.mount(['guiness'], function () {
                done();
            });
            d.removeListener(['guiness'], removable);
            d.send(['guiness']);
        });

        it('should be called with ctxt.to', function (done) {
            d.mount(['hostA'], function (body, ctxt) {
                assert.deepEqual(ctxt.to, ['hostA']);
                done();
            });
            d.send(['hostA']);
        });

        it('should be called with ctxt.from', function (done) {
            d.mount(['hostB'], function (body, ctxt) {
                assert.deepEqual(ctxt.from, ['sourceA']);
                done();
            });
            d.send(['hostB'], ['sourceA']);
        });

        it('should be called with undefined body when no body is provided', function (done) {
            d.mount(['hostC'], function (body, ctxt) {
                assert(_.isUndefined(body));
                done();
            });
            d.send(['hostC'], ['sourceB']);
        });

        it('should be called with body when one is provided', function (done) {
            d.mount(['hostD'], function (body, ctxt) {
                assert.deepEqual(ctxt.body, {a: 1});
                done();
            });
            d.send(['hostD'], [], {a: 1});
        });

        it('should be called same body on ctxt and arg', function (done) {
            d.mount(['hostD'], function (body, ctxt) {
                assert.equal(body, ctxt.body);
                done();
            });
            d.send(['hostD'], [], {a: 1});
        });


        it('should be called with options even when not provided', function (done) {
            d.mount(['hostD'], function (body, ctxt) {
                assert(_.isObject(ctxt.options));
                done();
            });
            d.send(['hostD'], [], {a: 1});
        });

        it('should be called with provided options', function (done) {
            d.mount(['hostD'], function (body, ctxt) {
                assert.deepEqual(ctxt.options, {a: 2});
                done();
            });
            d.send(['hostD'], [], {a: 1}, {a: 2});
        });

        it('should NOT be triggered on target message for other hosts', function (done) {
            var received = 0;
            d.mount(['hostE'], function () {
                received++;
            });
            d.mount(['host1'], function () {
                assert.equal(received, 0);
                received++;
                done();
            });

            d.send(['host1']);
        });

    });

    describe('mounted tree', function () {

        it('should be possible to mount hosts in a tree structure', function (done) {
            d.mount([], {
                host: function () {
                    done();
                }
            });
            d.send(['host']);
        });

        it('should be possible to mount host trees directly', function (done) {
            d.mount({
                go: function () {
                    done();
                }
            });
            d.send(['go']);
        });


        it('should be possible to mount hosts in a tree structure below a static trunk', function (done) {
            d.mount(['cookie'], {
                sword: function () {
                    done();
                }
            });
            d.send(['cookie', 'sword']);
        });

        it('should be possible to mount deep tree structure', function (done) {
            d.mount([], {
                treat: {
                    grass: function () {
                        done();
                    }
                }
            });
            d.send(['treat', 'grass']);
        });

        it('should be possible to mount deep tree structure under a static root', function (done) {
            d.mount(['phew'], {
                come: {
                    around: function () {
                        done();
                    }
                }
            });
            d.send(['phew', 'come', 'around']);
        });

        it('should be possible to mount multiple deep tree structures', function (done) {
            var called = [];
            d.mount([], {
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

            d.send(['huh', 'pizza']);
            d.send(['no', 'more']);
        });

        it('should be possible to mount array', function () {
            var called = [];
            d.mount(['yeah'], [
                function () {
                    called.push('dragon');
                }
                , function () {
                    called.push('drag-on');
                }
            ]);

            d.send(['yeah']);
            assert.deepEqual(['dragon', 'drag-on'], called);
        });

        it('should be possible to mount nested array', function () {
            var called = [];
            d.mount([], {
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

            d.send(['juicy', 'apple']);
            assert.deepEqual(['no', 'acceptable'], called);
        });

    });

});
