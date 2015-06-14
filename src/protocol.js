/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('lodash');
var HevEmitter = require('hevemitter').EventEmitter;
var inherits = require('inherits');
var Promise = require('bluebird');
var uid = require('./uid');

var Message = require('./message');

var mountParametrized = function (domain, point, host) {
    var params = [];
    var tailparams = [];
    if (!(_.isArray(point) && point.length > 0)) {
        throw new Error('Unable to mount empty point');
    }
    point = _.map(point, function (name, index) {
        if (_.isString(name) 
            && name[0] === ':') {
            if (name[1] === ':') {
                tailparams.push([name.slice(2), index]);
                return '**';
            }
            else {
                params.push([name.slice(1), index]);
                return '*';
            }
        }
        else {
            return name;
        }
    });
    var f = host;
    if (params.length !== 0 
        || tailparams.length !== 0) {
        f = function (body, ctxt) {
            ctxt.params = {};
            _.each(params, function (param) {
                ctxt.params[param[0]] = ctxt.to[param[1]];
            });
            _.each(tailparams, function (tailparam) {
                ctxt.params[tailparam[0]] = ctxt.to.slice(tailparam[1]);
            });
            return host(body, ctxt);
        };
        f.listener = host;
    }
    domain.on(point, f);
};

var Domain = function (options) {
    var _this = this;
    _this.hosts = {};
    HevEmitter.call(_this);
    _this.options = options || {};
};

inherits(Domain, HevEmitter);

_.extend(Domain.prototype, {
    mount: function (point, host) {
        var _this = this;

        if (arguments.length < 2)
        {
            host = point;
            point = [];
        }

        if (_.isString(point)) {
            point = [point];
        }

        if (_.isFunction(host)) {
            mountParametrized(_this, point, host);
        }
        else if (_.isArray(host)) {
            _.each(host, function (f) {
                _this.mount(point, f);
            });
        }
        else if (_.isObject(host)) {
            _.each(host, function (f, n) {
                _this.mount(point.concat(n), f);
            });
        }
        else {
            throw new Error('Unacceptable host type ' + typeof host + ' ' + host);
        }
        return _this;
    }
    , unmount: function (point) {
        var _this = this;
        _this.removeAllListeners(point);
        _this.removeAllListeners(point.concat('**'));
    }
    , send: function (to, from, body, options) {
        var _this = this;
        if (!to || to.length < 1) {
            return;
        }
        return _this.emit(to, body, new _this.Message({
            domain: _this
            , to: to
            , from: from
            , body: body
            , options: options
        }));
    }
    , uid: uid
    , waitFor: function (route, options) {
        var _this = this;
        var domain = _this;
        options = _.defaults({}, options, {
            timeout: 0
        });
        return new Promise(function (resolve, reject) {
            var timer;
            var receiver = function (body, ctxt) {
                if (timer) {
                    clearTimeout(timer);
                }
                resolve(new _this.Message(ctxt));
            };
            domain.once(route, receiver);
            if (options.timeout > 0) {
                timer = setTimeout(function () {
                    domain.removeListener(route, receiver);
                    reject(false);
                }, 1000 * options.timeout);
            }
        });
    }
});


var makeConstructor = function (Domain) {
    var constructor = function (options) {
        return new Domain(options);
    };

    constructor.use = function (extender) {

        var NewDomain = function (options) {
            Domain.call(this, options);
        };
        inherits(NewDomain, Domain);

        var Message = Domain.prototype.Message;
        var NewMessage = function (options) {
            Message.call(this, options);
        };
        inherits(NewMessage, Message);
        NewDomain.prototype.Message = NewMessage;

        extender(NewDomain)
        return makeConstructor(NewDomain);
    };
    return constructor;
};

Domain.prototype.Message = Message;
module.exports = makeConstructor(Domain);


