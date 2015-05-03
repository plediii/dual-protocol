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
address is a HevEmitter event, which are lists of strings.  

The entity associated with the message is expressed by the optional
body.  Messages without bodies can be interpreted like HTTP GET or
HEAD requests; similarly messages with bodies may be interpreted like
HTTP POST or PUT.  The event body should be JSON serializable.  In
order for the message to cross interprocess boundaries, the body must
be JSON serializable.

The optional source address provides information orthogonal to the
body information, which the destination host canx use to create a
[layered system](http://en.wikipedia.org/wiki/Representational_state_transfer#Layered_system)
 in the RESTful sense.  Practically, hosts may use the
source address to affect message processing in a manner distinct
from the expected function of the body (e.g., source address
filtering, responses, proxy).

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

The `dual-protocol` object will also attach the domain on which
message is sent at `ctxt.domain`.  The host may use this domain to
transmit additional messages or responses.

For example the following host will print all messages it received,
and forward a copy of the message to a host in the "database" hierarchy:

```javascript
domain.mount(['message', ':name'], function (ctxt) {
    console.log(ctxt.from.join('/') + ' sent a message to ' + ctxt.params.name + ' at the dual protocol address ' + ctxt.from.join('/') + '. The message is : ', ctxt.body);
    ctxt.domain.send(['database', 'message', ':name'], [], ctxt.body);
});
```

## Sending messages

Messages can be sent to hosts via the method `domain.send(to, from, body, options)`.
```javascript
domain.send(['journal', 'bioinformatics'], ['scientist'], 'The Human Genome');
```

Sending the above message results in the output:
```shell
scientist published to the journal of bioinformatics at the dual protocol address journal/bioinformatics.  The message is :  The Human Genome
```

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





