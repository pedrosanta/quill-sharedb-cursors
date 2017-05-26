var path = require('path');

module.exports = {
  entry: './public/javascripts/main.js',

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'public/dist')
  }
};
