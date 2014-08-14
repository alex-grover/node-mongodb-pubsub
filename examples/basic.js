var MongoClient = require('../index.js').MongoClient;

MongoClient.connect('mongodb://localhost:27017', function(err, db) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  issueFirstSubscription(db);
});

var issueFirstSubscription = function(db) {
  // issue first subscribe
  db.subscribe('channel', function(err, subscription) {
    if (err) {
      console.log(err);
      process.exit(1);
    }

    // register message handler
    subscription.on('message', function(message) {
      console.log(JSON.stringify(message, null, 2));
      db.unsubscribe(subscription, function(err, res) {
        processUnsub();
      });
    });

    // register error handler
    subscription.on('error', function(error) {
      console.log(error);
      process.exit(1);
    });

    issueSecondSubscription(db);
  });
}

var issueSecondSubscription = function(db) {
  // issue second subscribe
  db.subscribe('test', function(err, subscription) {
    if (err) {
      console.log(err);
      process.exit(1);
    }

    // register message handler
    subscription.on('message', function(message) {
      console.log(JSON.stringify(message, null, 2));
      db.unsubscribe(subscription, function(err, res) {
        processUnsub();
      });
    });

    // register error handler
    subscription.on('error', function(error) {
      console.log(error);
      process.exit(1);
    });
  
    publishMessages(db);
  });
}

var publishMessages = function(db) {
  // publish messages to both channels
  db.publish('channel', {hello: 'world'});
  db.publish('test', {another: 'message'});
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
