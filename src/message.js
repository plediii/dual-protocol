/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('lodash');
var HevEmitter = require('hevemitter').EventEmitter;
var inherits = require('util').inherits;
var Promise = require('bluebird');
var uid = require('./uid');

var Message = module.exports = function (options) {
    var _this = this;
    _.extend(_this, _.defaults(_.pick(options, 'domain', 'to', 'from', 'body', 'options')
                              , {
                                  to: []
                                  , from: []
                                  , options: {}
                              }));
};

_.extend(Message.prototype, {
    send: function (to, from, body, options) {
        return this.domain.send(to, from, body, options);
    }
    , error: function (message) {
        var _this = this;
        _this.send(['error'].concat(_this.to), [], {
            message: message
            , ctxt: {
                to: _this.to
                , from: _this.from
                , body: _this.body
                , options: _this.options
            }
        });
    }
    , toJSON: function () {
        return _.pick(this, 'to', 'from', 'body', 'options');
    }
    , parent: function (n) {
        if (n !== 0) {
            n = n || 1;
        }
        var _this = this;
        if (n > _this.to.length) {
            throw new Error('Invalid parent slice ' + n + ' for point ' + _this.to.join('/'));
        }
        else {
            return _this.to.slice(0, _this.to.length - n);
        }
    }
});
