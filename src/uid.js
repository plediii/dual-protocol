/*jslint node: true */
/* global -Promise */
"use strict";

var Promise = require('./Promise');
var _ = require('./lodash');
var createHash = require('create-hash');
var escape = require('base64-url').escape;
var randomBytes = Promise.promisify(require('randombytes'));

var cryptoSupport = true;       // whether or not the javascript engine has a cryptographically secure number generator
if (!cryptoSupport) {
    console.error('Crypto RNG is not available: ', e);
}

var digest = function (a) {
    var shasum = createHash('sha256');
    shasum.update(a);
    return shasum.digest('hex');
};

var toString = function (buf) {
  return escape(buf.toString('base64'));
}

var keygen = (function () {
    var keylen = 48;
    if (cryptoSupport) {
        return function () {
            return randomBytes(keylen)
            .then(toString);
        };
    }
    else {
        return function () {
            var u = '';
            var d = Date.now();
            for (var i = 0; i < keylen; i++) {
                u += (((d + Math.random() * 16) % 16) | 0).toString(16);
                d = Math.floor(d/16);
            }
            return Promise.resolve(u);
        };
    }
})();

// would be awesome if this was secure
var counter = 0;
var previousUid = '';
var key = keygen();
var regen = function () {
    return Promise.join(
        keygen()
        , key
        , function (newkey, oldkey) {
            key = Promise.resolve(digest(oldkey + newkey + previousUid));
        });
};


module.exports = function (Domain) {
    Domain.prototype.uid = function () {
        return key.then(function (k) {
            previousUid = digest(previousUid + k + (counter++) + Date.now());
            if (counter % 50 === 0) {
                regen();
            }
            return previousUid.slice(0, 32);
        });
    };
    Domain.prototype.uid.regen = regen;
};
