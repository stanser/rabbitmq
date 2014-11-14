var BrokerObj = require('../src/Broker.js');

var broc = new BrokerObj.Broker();

//broc.sendMsg();

var result = broc.sendMsg();

console.log (result);