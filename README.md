# Dual Protocol

This is the protocol layer for dual-api.

Dual protocol is implemented on top of [HevEmitter](https://github.com/plediii/HevEmitter).  HevEmitter is a hierarchical event emitter.  HevEmitter provides the functionality to send messages to hierarchically organized functions.  

Dual protocol extends HevEmitter by constraining the format of the messages sent to the HevEmitter listeners.

## Constructing dual protocol domains

Any process holding a dual protocol domain (including the mounted hosts) may send messages to any host in the domain without constraint on the destination.  

The dual protocol module is the constructor for domains:
```javascript
var dualproto = require('dual-protocol');

var domain = dualproto();
```

## Messages

Dual protocol messages (named `ctxt` here) are similar in structure to HTTP requests.  Dual protocol messages consist in:
* A destination address: `ctxt.to`.  
* An optional source address: `ctxt.from`.
* An optional body: `ctxt.body`.  
* And an optional hash of meta data: `ctxt.options`.

The destination and source should be an array of strings.  The message `body` and `options` should be a JSON serializable objects. The `body` and `options` are not required to be JSON serializable, however failing to adhere to this constraint will prevent messages from crossing some domain boundaries.

## Mounting a host

A dual protocol `host` is a function which accepts dual protocol messages.  Hosts are mounted on the domain using the `mount` method.

In addition to the attributes associated with a dual protocol messages, the `dual-protocol` object will automatically parse parameters declared in the destination address (prefixed with `:`), and provide these in the `ctxt.params` object.

The `dual-protocol` object will also attach the domain on which the host is mounted at `ctxt.domain`.

```javascript
domain.mount(['journal', ':name'], function (ctxt) {
    console.log(ctxt.from.join('/') + ' published to the journal of ' + ctxt.params.name + ' at the dual protocol address ' + ctxt.from.join('/') + '. The message is : ', ctxt.body);
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





