var mongo = require('../index.js');

var count = 0

// get an instance of MongoClient
var mongoClient = new mongo.MongoClient(new mongo.Server('localhost', 27017));
mongoClient.open(function(err, mongoClient) {
  mongoClient.subscribe('channel', {filter: {message: 'filter'}}, function (err, subscription) {
    subscription.on('message', function(message) {
      console.log('filter subscription got message: ' +
                  JSON.stringify(message.data, null, 2));
      count++;
      checkShouldExit();
    });

    mongoClient.subscribe('channel', {projection: {number: 1}}, function(err, subscription) {
      subscription.on('message', function(message) {
        console.log('projection subscription got message: ' +
                    JSON.stringify(message.data, null, 2));
        count++;
        checkShouldExit();
      });

      var options = {filter: {message: 'filter'}, projection: {message: 1}};
      mongoClient.subscribe('channel', options, function(err, subscription) {
        subscription.on('message', function(message) {
          console.log('filter/projection subscription got message: ' +
                      JSON.stringify(message.data, null, 2));
          count++;
          checkShouldExit();
        });
        
        // All subscriptions will get this, but projection subscription will only have
        // number field and filter/projection subscription will only have message field
        mongoClient.publish('channel', {message: 'filter', number: 1});

        // Only projection field will get this and will only have number field
        mongoClient.publish('channel', {message: 'should be filtered out', number: 2});

      });
    });
  });
});

var checkShouldExit = function() {
  if (count === 4) process.exit(0);
}


// Output:
// - filter subscription got message: {
// -   "message": "filter",
// -   "number": 1
// - }
// - filter/projection subscription got message: {
// -   "message": "filter"
// - }
// - projection subscription got message: {
// -   "number": 1
// - }
// - projection subscription got message: {
// -   "number": 2
// - }
