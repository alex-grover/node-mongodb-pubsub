var mongo = require('../index.js');

// get an instance of MongoClient
var mongoClient = new mongo.MongoClient(new mongo.Server('localhost', 27017));
mongoClient.open(function(err, mongoClient) {
  console.log('Opened a MongoClient connection.');

  // now you can publish, subscribe, and unsubscribe
  mongoClient.subscribe('test', function(err, subscription) {
    console.log('Subscribed to \'test\'.');

    // register event handlers on subscription object
    subscription.on('message', function(message) {

      // message contains fields 'subscription', 'channel', and 'data'
      console.log('Received message. ' + message.channel + ': ' + JSON.stringify(message.data, null, 2));

      // unsubscribe after receiving a single message.
      mongoClient.unsubscribe(subscription, function(err, res) {
        console.log('Unsubscribed. All done!');
        process.exit(0);
      });
    });

    // publish a message when the subscriber is ready
    mongoClient.publish('test', {hello: 'world'}, function(err, res) {
      console.log('Published message.');
    });

  });

});

// Output:
// - Opened a MongoClient connection.
// - Subscribed to 'test'.
// - Published message.
// - Received message. test: {
// -   "hello": "world"
// - }
// - Unsubscribed. All done!
