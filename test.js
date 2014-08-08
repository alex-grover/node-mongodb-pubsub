var mongo = require('./index.js');

var mongoClient = new mongo.MongoClient(new mongo.Server('localhost', 27017));
mongoClient.open(function(err, mongoClient) {
    mongoClient.subscribe('channel', function(message) {
        console.log(JSON.stringify(message, null, 2));
    });

    var i = 0;
    setInterval(function() {
        mongoClient.publish('channel', {number: i});
        i++;
    }, 2000);
});
