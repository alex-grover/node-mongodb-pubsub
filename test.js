var mongo = require('./index.js');

var mongoClient = new mongo.MongoClient(new mongo.Server('localhost', 27017));
mongoClient.open(function(err, mongoClient) {

  // issue first subscribe
  mongoClient.subscribe('channel', function(subscription) {
    // register message handler
    subscription.on('message', function(message) {
      console.log(JSON.stringify(message, null, 2));
      mongoClient.unsubscribe(subscription, function(err, res) {
        processUnsub();
      });
    });

    // issue second subscribe
    mongoClient.subscribe('test', function(subscription) {
      // register message handler
      subscription.on('message', function(message) {
        console.log(JSON.stringify(message, null, 2));
        mongoClient.unsubscribe(subscription, function(err, res) {
          processUnsub();
        });
      });

      // publish messages to both channels
      mongoClient.publish('channel', {hello: 'world'});
      mongoClient.publish('test', {another: 'message'});

    });
  });
});

// only exit after messages have been received on both channels
var shouldExit = false;
var processUnsub = function(){
  if (shouldExit) {
    process.exit(0);
  } else {
    shouldExit = true;
  }
}
