var mongo = require('./index.js');

var mongoClient = new mongo.MongoClient(new mongo.Server('localhost', 27017));
mongoClient.open(function(err, mongoClient) {


    // subscription object that receives 'message' event
    var subscription;
    mongoClient.subscribe('channel', function(_subscription) {
        subscription = _subscription;
        subscription.on('message', function(message) {
            // handle message on 'channel'
            console.log(JSON.stringify(message, null, 2));
        });
    });

    subscription.id; // ObjectId

    mongoClient.unsubscribe(subscription);


    var i = 0;
    setInterval(function() {
        mongoClient.publish('channel', {number: i});
        i++;
    }, 2000);
});
