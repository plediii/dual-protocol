/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('lodash');

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
    toJSON: function () {
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
