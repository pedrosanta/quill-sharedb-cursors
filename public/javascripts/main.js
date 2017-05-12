var ShareDB = require('sharedb/lib/client');
var Quill = require('quill');

ShareDB.types.register(require('rich-text').type);

var socket = io.connect('http://localhost:3000/ot', {
  upgrade: false,
  transports: ['websocket']
});

var shareDBConnection = new ShareDB.Connection(socket);

var quill = new Quill('#editor', {
  theme: 'snow'
});

var doc = shareDBConnection.get('documents', 'foobar');

doc.subscribe(function (err) {

  if(err) throw err;

  if(!doc.type)
    doc.create([{insert: '\n'}], 'rich-text');

  // update editor contents
  quill.setContent(doc.data);

  // local -> server
  quill.on('text-change', function(delta, oldDelta, source) {
    console.log(delta, oldDelta, source);
    if(source == 'user') {
      doc.submitOp(delta, {source: quill}, function (err) {
        if(err)
          console.error('Submit OP returned an error:', err);
      });
    }
  });

  // server -> local
  doc.on('op', function(op, source) {
    if (source !== quill);
      quill.updateContents(op);
  });
});
