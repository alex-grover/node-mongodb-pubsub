var MongoClient = require('../index.js').MongoClient;

MongoClient.connect('mongodb://localhost:27017', function(err, db) {
  console.log('Opened a connection.');

  // now you can publish, subscribe, and unsubscribe
  db.subscribe('test', function(err, subscription) {
    console.log('Subscribed to \'test\'.');

    // register event handlers on subscription object
    subscription.on('message', function(message) {

      // message contains fields 'subscription', 'channel', and 'data'
      console.log('Received message. ' + message.channel +
                  ': ' + JSON.stringify(message.data, null, 2));

      // unsubscribe after receiving a single message.
      db.unsubscribe(subscription, function(err, res) {
        console.log('Unsubscribed. All done!');
        process.exit(0);
      });
    });

    // publish a message when the subscriber is ready
    db.publish('test', {hello: 'world'}, function(err, res) {
      console.log('Published message.');
    });

  });

});

// Output:
// - Opened a connection.
// - Subscribed to 'test'.
// - Published message.
// - Received message. test: {
// -   "hello": "world"
// - }
// - Unsubscribed. All done!
