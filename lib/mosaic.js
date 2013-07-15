"use strict";

var url = require('url')
var readline = require('readline')
var settings = require('./settings')


exports.set = function(p, v) {
  settings[p] = v
}

exports.get = function(p) {
  return settings[p]
}

exports.remote = function(path) {
  return url.format({
    protocol: 'http',
    host: exports.get('daemon'),
    pathname: 'api/' + path
  })
}

var utils = require('./utils')

for (var p in utils) {
  if (utils.hasOwnProperty(p)) {
    exports[p] = utils[p]
  }
}

