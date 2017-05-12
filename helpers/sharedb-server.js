var ShareDB = require('sharedb');

ShareDB.types.register(require('rich-text').type);

module.exports = new ShareDB({
  db: require('sharedb-mongo')('mongodb://localhost:27017/quill-sharedb-cursors')
});
