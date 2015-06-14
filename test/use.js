/*jslint node: true */
"use strict";

var dualproto = require('../index');
var _ = require('lodash');
var assert = require('assert');

describe('dualproto', function () {
    
    describe('use', function () {

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

        // test that waitfor uses the extended message type

    });

});
