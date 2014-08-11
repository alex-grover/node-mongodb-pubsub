## MongoDB Node.js Driver + Pub/Sub

An example driver to be used with Node.js in conjunction with 10gen-interns/pubsub.

## Usage

- To be updated

```javascript
var mongo = require('./index.js');

var mongoClient = new mongo.MongoClient(new mongo.Server('localhost', 27017));
mongoClient.open(function(err, mongoClient) {
  mongoClient.subscribe('channel', function(subscription) {
    subscription.on('message', function(message) {
      console.log(JSON.stringify(message, null, 2));
    });
    mongoClient.publish('channel', {hello: 'world'});
  });
});
```

## API Documentation

Three basic methods are provided to interact with MongoDB's Pub/Sub system: `publish`, `subscribe`, and `unsubscribe`.

### Publish

Usage: `mongoClient.publish('channel', {key: value});`

The publish method sends a document to the channel specified.


TODO: Subscribe, Unsubscribe, and timeout option
