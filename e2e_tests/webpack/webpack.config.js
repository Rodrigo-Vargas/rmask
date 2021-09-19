const path = require('path');
const webpack = require('webpack');

module.exports = {
   mode: 'production',
   entry: {
      scripts: './src/main.js',
   },
   output: {
      path: path.resolve(__dirname, '../lib'),
      filename: '[name].bundle.js',
   },
   module: {
      rules: [
         {
            test: /\.js$/i,
            exclude: /node_modules/,
            use: {
               loader: 'babel-loader',
               options: {
                  presets: ['@babel/preset-env']
               }
            }
         }
      ]
   },
   devtool: 'inline-source-map',
   plugins: [
      new webpack.ProgressPlugin()
   ]
};
