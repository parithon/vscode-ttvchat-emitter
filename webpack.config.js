//@ts-check

'use strict';

const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

/**@type {import('webpack').Configuration} */
const config = {
  target: 'node',
  entry: './src/extension.ts',
  output: {
    path: path.resolve(__dirname, 'out'),
    filename: 'extension.js',
    libraryTarget: 'commonjs2',
    devtoolModuleFilenameTemplate: '../[resource-path]'
  },
  devtool: 'source-map',
  externals: {
    vscode: 'commonjs vscode' // the vscode-module is created on-the-fly and must be excluded
  },
  resolve: {
    extensions: ['.ts','.js']
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    new CleanWebpackPlugin(),
    new CopyPlugin([{ from: './**/*.htm', context: './src' }])
  ]
};

module.exports = config;
