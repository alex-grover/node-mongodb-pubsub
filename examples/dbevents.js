var MongoClient = require('../index.js').MongoClient;

var count = 0;

MongoClient.connect('mongodb://localhost:27017/foo', function(err, db) {
  
  db.collection('bar').watch(function(err, change) {
    if (err) throw err

    console.dir(change);
    if (change.type === 'remove') {
      process.exit(0);
    }
  });

  db.collection('bar').insert({a: 1}, function() {
    db.collection('bar').update({a: 1}, {a: 2}, function() {
      db.collection('bar').remove({a: 2}, function() {});
    });
  });

});
