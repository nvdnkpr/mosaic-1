"use strict";

var url = require('url')
var readline = require('readline')
var settings = require('./settings')


exports.question = function(ask,callback){
  ask = ask || 'Default question?'

  var args = Array.prototype.slice.call(arguments,0)
  var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  })

  rl.question(ask, function(answer) {
    rl.close()

    if (typeof callback === 'function') {
      callback.redo = function(){
        exports.question.apply(null,args)
      }
      callback.call(callback,answer)
    }
  })
}


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

