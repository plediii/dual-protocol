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

In addition to the attributes associated with dual protocol messages,
the `dual-protocol` object will automatically parse parameters
declared in the destination address (strings prefixed with `:`), and
provide these in the `ctxt.params` object.  Strings prefixed with `::`
will match the *rest* of the address.

For example the following host will record all messages
it receives in a list.

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
## Sending messages with `domain.send`

Messages are sent to hosts mounted on the domain via  `domain.send(to, from, body, options)`.

```javascript
domain.send(['database', 'message'], [], 'Hello Alice!');
```

Here we are using an empty source address since `'database'` is not
attempting to make a reply, nor do we have a mounted host ready to
receive a reply.

In addition to the usual message properties, dual-protocol also
attaches a reference to the domain the host received the message from
at `ctxt.domain`.  The host may could the domain to send additional
messages and/or replies.  For example, the following host outputs
information about the message to the console, and forwards a copy of
the message to the database.

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

## Creating temporary hosts with `domain.waitFor`

In several cases, it is convenient to create a host to wait for a
single message, such as a *ready* event, or a response, without
leaving a permanently listening host at that address.  Dual-protocol
provides the `domain.waitFor(event, options)` method for this purpose.  

`domain.waitFor` returns a promise that will resolve when the event
has been received.  For instance, we create a listener for `'ready'`:
```javascript
domain.waitFor(['ready'], { timeout: 60000 })
.then(function (ctxt) {
  console.log('We are ready!');
});
```

Then we can trigger this host once, and only once, by using
`domain.send`.  If the `timeout` option is provided, the host will be
cancelled `timeout` milliseconds if provided.

In order to wait for a response to a specific message, we need to
create a unique host name that is only known only by the request
originator.  Dual-protocol includes a unique id generator at
`domain.uid`.  

```javascript
domain.uid().then(function (mailbox) {
  domain.waitFor([mailbox])
  .then(function (ctxt) {
    console.log('My temporary mailbox just received: ', ctxt.body);
  });

  domain.send([mailbox], [], 'mail!');
});

## Extending dual-protocol

Dual-protocol may customized with further constraints and additional functions.

TODO
