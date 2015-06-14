/*jslint node: true */
/* global -Promise */
"use strict";

var _ = require('lodash');

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

module.exports = function (Domain) {
    Domain.prototype.mount = function (point, host) {
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
    };
};
