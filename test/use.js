/*jslint node: true */
"use strict";

var dualproto = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualproto', function () {
    
    describe('use', function () {

        it('should raise exception if executed with non-function', function () {
            assert.throws(function () {
                dualproto.use(null);
            }, /use.*function/);
        });

        it('should allow adding functions to Domain prototype', function (done) {
            var api = dualproto.use(function (Domain) {
                Domain.prototype.cutout = function () {
                    done();
                };
            });
            api().cutout();
        });

        it('should allow adding functions to Message prototype', function (done) {
            var api = dualproto.use(function (Domain) {
                Domain.prototype.Message.prototype.cutout = function () {
                    done();
                };
            });
            var domain = api(); 
            domain.mount(['hey'], function (body, ctxt) {
                ctxt.cutout();
            });
            domain.send(['hey']);
        });

        it('should be further extendable', function (done) {
            var api = dualproto.use(function (Domain) {
                Domain.prototype.cutout = function () {
                    done('called original function');
                };
            });
            var subApi = api.use(function (Domain) {
                Domain.prototype.cutout = function () {
                    done();
                };
            });
            subApi().cutout();
        });

        it('should be able to further extend the message', function (done) {
            var api = dualproto.use(function (Domain) {
                Domain.prototype.Message.prototype.cutout = function () {
                    done('called original message function');
                };
            });
            var subApi = dualproto.use(function (Domain) {
                Domain.prototype.Message.prototype.cutout = function () {
                    done();
                };
            });
            var domain = subApi(); 
            domain.mount(['hey'], function (body, ctxt) {
                ctxt.cutout();
            });
            domain.send(['hey']);
        });

        it('should not monkey patch the original object', function (done) {
            var api = dualproto.use(function (Domain) {
                Domain.prototype.cutout = function () {
                    done();
                };
            });
            var subApi = api.use(function (Domain) {
                Domain.prototype.cutout = function () {
                    done('original function was monkey patched');
                };
            });
            api().cutout();
        });

        it('should not monkey patch the original object when further extending the same root', function (done) {
            var api = dualproto.use(function (Domain) {
                Domain.prototype.cutout = function () {
                    done();
                };
            });
            var subApi = dualproto.use(function (Domain) {
                Domain.prototype.cutout = function () {
                    done('original function was monkey patched');
                };
            });
            api().cutout();
        });

        it('should not monkey patch message when further extending', function (done) {
            var api = dualproto.use(function (Domain) {
                Domain.prototype.Message.prototype.cutout = function () {
                    done();
                };
            });
            var subApi = api.use(function (Domain) {
                Domain.prototype.Message.prototype.cutout = function () {
                    done('original message function was monkey patched');
                };
            });
            var domain = api(); 
            domain.mount(['hey'], function (body, ctxt) {
                ctxt.cutout();
            });
            domain.send(['hey']);
        });

        it('should not monkey patch message when further extending from the same root', function (done) {
            var api = dualproto.use(function (Domain) {
                Domain.prototype.Message.prototype.cutout = function () {
                    done();
                };
            });
            var subApi = dualproto.use(function (Domain) {
                Domain.prototype.Message.prototype.cutout = function () {
                    done('original message function was monkey patched');
                };
            });
            var domain = api(); 
            domain.mount(['hey'], function (body, ctxt) {
                ctxt.cutout();
            });
            domain.send(['hey']);
        });


        it('should extend the context returned by waitfor', function (done) {
            var api = dualproto.use(function (Domain) {
                Domain.prototype.Message.prototype.cutout = function () {
                    done();
                };
            });
            var domain = api(); 
            domain.waitFor(['hey'])
            .then(function (ctxt) {
                ctxt.cutout();
            });
            domain.send(['hey']);
        });

        it('should be called with a libs object', function (done) {
           dualproto.use(function (Domain, libs) {
               assert(_.isObject(libs));
               done();
            });
        });

        it('should provide libs attributes to descendants', function (done) {
           dualproto.use(function (Domain, libs) {
               libs.wizard = 'robe';
            })
            .use(function (Domain, libs) {
                assert.equal(libs.wizard, 'robe');
                done();
            });
        });

        it('should not overide libs attributes in siblings', function (done) {
           dualproto.use(function (Domain, libs) {
               libs.wizard = 'robe';
            });
            dualproto.use(function (Domain, libs) {
                assert(!libs.hasOwnProperty('wizard'));
                done();
            });
        });


    });

});
