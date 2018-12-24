const { MongoClient } = require('mongodb');

module.exports = () =>
  MongoClient
    .connect('mongodb://localhost:27017')
    .then(client => client.db('powercord'))
    .then(db => db.collection('tokens'))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
