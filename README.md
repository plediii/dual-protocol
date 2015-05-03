# Dual-protocol

This is the protocol layer for dual-api.

Dual-protocol extends my hierarchical event emitter,
[HevEmitter](https://github.com/plediii/HevEmitter), by constraining the schema of 
the event bodies to create an *HTTP-like* layered system.

## Messages

Dual protocol messages (assuming an instance named `ctxt` here) are similar 
in concept to HTTP requests.  Dual protocol messages consist in:
* A destination address: `ctxt.to`.  
* An optional source address: `ctxt.from`.
* An optional body: `ctxt.body`.  
* And an optional hash of meta data (like headers): `ctxt.options`.

The destination address names a resource controlled by a host function
mounted on the dual-protocol domain.  Under the hood, the destination
address is a HevEmitter event, which is lists of strings.  

The entity associated with the message is expressed by the optional
body.  Messages without bodies can be interpreted like HTTP GET or
HEAD requests; similarly messages with bodies may be interpreted like
HTTP POST or PUT.  The event body should be JSON serializable.  In
order for the message to cross interprocess boundaries, the body must
be JSON serializable.

The optional source address provides information orthogonal to the
body information, which the destination host canx use to create a
[layered system](http://en.wikipedia.org/wiki/Representational_state_transfer#Layered_system)
in the RESTful sense.  The source address should also be a HevEmitter
event.  Practically, hosts may use the source address to affect
message processing in a manner distinct from the expected function of
the body (e.g., source address filtering, responses, proxy).

Finally, the optional hash of meta data is similar to headers in HTTP.
`ctxt.options` express information about the message orthogonal to
both the source and body, providing information which aid in
processing, but do not affect the function of the host (e.g.,
authorization tokens, body schema, classification).

Dual-protocol also extends the message objects with customizable
convenience functions (TODO: enumerate).

## Constructing dual-protocol domains

Any process holding a dual-protocol domain instance may send messages
to any host in mounted on the domain.  Host functions receive a
reference to domain on which the message was sent on each request.


The dual-protocol module is the constructor for domain instances:
```javascript
var dualproto = require('dual-protocol');
var domain = dualproto();
```

## Mounting a host

A dual protocol *host* is a function which accepts dual protocol
messages.  Hosts are mounted on the domain using the `mount` method.

In addition to the attributes associated with dual protocol
messages, the `dual-protocol` object will automatically parse
parameters declared in the destination address (prefixed with `:`),
and provide these in the `ctxt.params` object.

For example the following host will record all messages
it receives in a javascript list.

```javascript
var db = {};
domain.mount(['database', ':collection'], function (ctxt) {
    var collection = ctxt.params.collection;
    if (!db.hasOwnProperty(collection)) {
      db[collection] = [];
    }
    db[collection].push(ctxt.body);
});
```
We may send messages to this host using the `domain.send` method described below.

## Sending messages with `domain.send`

Messages are sent to hosts mounted on the domain via  `domain.send(to, from, body, options)`.

```javascript
domain.send(['database', 'message'], [], 'Hello Alice!');
```

Here we are using an empty source address indicating that we do not
want a receipt from the database.  However, the database is not
sending a response so doesn't matter just yet.  We can improve the
safety of the system by using the `ctxt.reply` and `domain.request`
methods described below.

In addition to the usual message properties, dual-protocol also
attaches a reference to the domain the host received the message from
at `ctxt.domain`.  The host may use this method to send additional
messages.  For example, the following host outputs information about
the message, and forwards a copy of the message to the database.

The `dual-protocol` object will also attach the domain on which the
message is sent at `ctxt.domain`.  For example the following host will
print all messages it received, and forwards a copy of the message to
the database:
```javascript
domain.mount(['message', ':name'], function (ctxt) {
    console.log(ctxt.from.join('/') + ' sent a message to ' + ctxt.params.name);
    console.log('The message was received by ' + ctxt.from.join('/'));
    console.log('The message is: ', ctxt.body);
    ctxt.domain.send(['database', 'message'], [], ctxt.body);
});
```

Then, a message such as:
```javascript
domain.send(['message', 'alice'], ['user', 'bob'], 'Hello Alice!');
```
would result in:
```shell
user/bob sent a message to alice
The message was received by message/alice
The message is: Hello Alice!
```

Since we have not yet mounted a host in the 'database' hierarchy, 
`ctxt.domain.send(['database', 'message', ':name'], [], ctxt.body);` would normally cause dual-protocol
to emit a message to the source address with a `ctxt.options.statusCode` set to 
the
However, since the source address is empty, `[]`, the message would be lost. 
We can handle this in a safer manner by 
with the `request` status function.

## Replying to messages with `ctxt.reply`

It's common for a host to send a response back to the source address.
For instance, the database may wish to reply with a message indicating
that it has safely stored the data. Dual-protcol attaches the
convenience function `ctxt.reply(body, options)`, to the incoming messages.
 
```javascript
var safedb = { message: [] };
domain.mount(['safedatabase', ':collection'], function (ctxt) {
    var collection = ctxt.params.collection;
    if (!safedb.hasOwnProperty(collection)) {
       ctxt.reply('No such collection.', { statusCode: '404' });
    }
    safedb[collection].push(ctxt.body);
    ctxt.reply('OK');
});
```
By default, reply will set `ctxt.options.statusCode` to the
[HTTP status code](http://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html)
`200`.  If the collection does not exist however, we are replying with a
`statusCode` of `404`.


## Replying to and forwarding messages

At the protocol level, hosts may reply to one another by sending messages directly to the source address.  Hosts are not required to emit a reply.  Constraints on the reply may be enforced at the API level.  

For instance we may mount a host that replies to source address like this:
```javascript
domain.mount(['laboratory', 'supercomputer'], function (ctxt) {
    ctxt.send(['journal', 'bioinformatics'], ctxt.to, 'Super computed ' + ctxt.body);
});
```

The source address at the protocol layer may be forged.  This allows the implementation of proxy hosts.  For instance the following host mounted at scientist simply forwards his messages to the super computer:
```javascript
domain.mount(['scientist'], function (ctxt) {
    domain.send(['laboratory', 'supercomputer'], ctxt.from, ctxt.body + ' by the scientist.');
});
```

Messages sent to the scientist,
```javascript
domain.send(['scientist'], ['gradstudent'], 'sequence alignment');
```
would result in the following published output
```shell
  scientist published to the journal of bioinformatics at the dual protocol address journal/bioinformatics.  The message is :  Super computed sequence alignment by the scientist.
```

## Mounting temporary addresses

The `'gradstudent'` in the above example could not receive messages, since there is no host mounted at `['gradstudent']`.  However, the gradstudent can still communicate with the super computer directly, by using the `waitFor` method.  Unforgeable addresses can be produced using the `uid` method.

```javascript
domain.uid()
.then(function (mailbox) {
   domain.waitFor([mailbox])
   .then(function (ctxt) {
     console.log('Received in the mailbox: ', ctxt.body);
   });
   domain.send(['laboratory', 'supercomputer'], [mailbox], 'the fruit fly genome');
});
```

The above would result in the output:
```shell
  Received in the mailbox: Super computed the fruit fly genome
```





