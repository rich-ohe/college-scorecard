var webpack = require('webpack');
module.exports = {
  entry: './js/src/picc.js',
  output: {
    path: 'js',
    filename: 'picc.js',
    library: 'picc'
  },
  debug: true,
  devtool: '#source-map',
  plugins: [
    new webpack.optimize.UglifyJsPlugin({
      mangle: false
    })
  ]
};
