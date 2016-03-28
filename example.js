"use strict";

var dualproto = require('./index');
var domain = dualproto();

var db = {};
domain.mount(['database', ':collection'], function (body, ctxt) {
    var collection = ctxt.params.collection;
    if (!db.hasOwnProperty(collection)) {
      db[collection] = [];
    }
    db[collection].push(ctxt.body);
});

domain.send(['database', 'message'], [], 'Hello Alice!');

domain.mount(['message', ':name'], function (body, ctxt) {
    console.log(ctxt.from.join('/') + ' sent a message to ' + ctxt.params.name);
    console.log('The message was received by ' + ctxt.to.join('/'));
    console.log('The message is: ', ctxt.body);
    ctxt.domain.send(['database', 'message'], [], ctxt.body);
});

domain.send(['message', 'alice'], ['user', 'bob'], 'Hello Alice!');

/*
user/bob sent a message to alice
The message was received by message/alice
The message is: Hello Alice!
*/

domain.waitFor(['ready'], { timeout: 60 })
.then(function (ctxt) {
  console.log('We are ready!');
});

domain.send(['ready']);
/*
We are ready!
*/


domain.uid().then(function (mailbox) {
  domain.waitFor([mailbox])
  .then(function (ctxt) {
    console.log('My temporary mailbox just received: ', ctxt.body);
  });

  domain.send([mailbox], [], 'mail!');
});

/*
My temporary mailbox just received:  mail!
*/

var api = dualproto.use(function (Domain) {
    Domain.prototype.Message.prototype.reply = function (body) {
        this.domain.send(this.from, [], body);
    };
});
var domain = api();
domain.mount(['responder'], function (body, ctxt) {
  ctxt.reply('Hello!');
});

domain.uid().then(function (mailbox) {
  domain.waitFor([mailbox])
  .then(function (ctxt) {
    console.log('Responder said: ', ctxt.body);
  });

  domain.send(['responder'], [mailbox], 'hello?');
});

/*
Responder said:  Hello!
*/
