var mongo = require('./index.js');

var mongoClient = new mongo.MongoClient(new mongo.Server('localhost', 27017));
mongoClient.open(function(err, mongoClient) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  issueFirstSubscription();
});

var issueFirstSubscription = function() {
  // issue first subscribe
  mongoClient.subscribe('channel', function(err, subscription) {
    if (err) {
      console.log(err);
      process.exit(1);
    }

    // register message handler
    subscription.on('message', function(message) {
      console.log(JSON.stringify(message, null, 2));
      mongoClient.unsubscribe(subscription, function(err, res) {
        processUnsub();
      });
    });

    // register error handler
    subscription.on('error', function(error) {
      console.log(error);
      process.exit(1);
    });

    issueSecondSubscription();
  });
}

var issueSecondSubscription = function() {
  // issue second subscribe
  mongoClient.subscribe('test', function(err, subscription) {
    if (err) {
      console.log(err);
      process.exit(1);
    }

    // register message handler
    subscription.on('message', function(message) {
      console.log(JSON.stringify(message, null, 2));
      mongoClient.unsubscribe(subscription, function(err, res) {
        processUnsub();
      });
    });

    // register error handler
    subscription.on('error', function(error) {
      console.log(error);
      process.exit(1);
    });
  
    publishMessages();
  });
}

var publishMessages = function() {
  // publish messages to both channels
  mongoClient.publish('channel', {hello: 'world'});
  mongoClient.publish('test', {another: 'message'});
}

// only exit after messages have been received on both channels
var shouldExit = false;
var processUnsub = function(){
  if (shouldExit) {
    process.exit(0);
  } else {
    shouldExit = true;
  }
}
