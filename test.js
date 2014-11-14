//db connection
var nano   = require('nano')('http://10-60-8-119-couchdb.kwebbl.dev:5984');
var amqp = require('amqp');
var gen = require("kwbl-gen");

console.log(gen);
