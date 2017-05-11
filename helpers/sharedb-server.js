var ShareDB = require('sharedb');

module.exports = new ShareDB({
  db: require('sharedb-mongo')('mongodb://localhost:27017/quill-sharedb-cursors')
});
