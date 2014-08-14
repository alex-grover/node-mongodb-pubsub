var MongoClient = require('../index.js').MongoClient;

var count = 0;

MongoClient.connect('mongodb://localhost:27017', function(err, db) {
  db.subscribe('channel', {filter: {message: 'filter'}}, function (err, subscription) {
    subscription.on('message', function(message) {
      console.log('filter subscription got message: ' +
                  JSON.stringify(message.data, null, 2));
      count++;
      checkShouldExit();
    });

    db.subscribe('channel', {projection: {number: 1}}, function(err, subscription) {
      subscription.on('message', function(message) {
        console.log('projection subscription got message: ' +
                    JSON.stringify(message.data, null, 2));
        count++;
        checkShouldExit();
      });

      var options = {filter: {message: 'filter'}, projection: {message: 1}};
      db.subscribe('channel', options, function(err, subscription) {
        subscription.on('message', function(message) {
          console.log('filter/projection subscription got message: ' +
                      JSON.stringify(message.data, null, 2));
          count++;
          checkShouldExit();
        });
        
        // All subscriptions will get this, but projection subscription will only have
        // number field and filter/projection subscription will only have message field
        db.publish('channel', {message: 'filter', number: 1});

        // Only projection subscription will get this and will only have number field
        db.publish('channel', {message: 'should be filtered out', number: 2});

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
