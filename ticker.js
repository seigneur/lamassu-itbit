'use strict';

var _       = require('lodash');
var Wreck   = require('wreck');
var async   = require('async');


exports.NAME = 'Itbit';
exports.SUPPORTED_MODULES = ['ticker'];
var API_ENDPOINT = 'https://api.itbit.com/v1/markets/';
var pluginConfig = {};


exports.config = function config(localConfig) {
  if (localConfig) _.merge(pluginConfig, localConfig);
};


function getTickerUrls(currencies) {
  var urls =[];
  currencies.forEach(function(currency) {
    urls.push(API_ENDPOINT + 'XBT' + currency + '/ticker');
  });

  return urls;
}

function formatResponse(currencies, results, callback) {
    var out = results.reduce(function(prev, current) { 
    if (current.pair == undefined)
        return {};
    else{
        current.code = current.pair.replace('XBT',''); //Itbit's tickers have an XBT Lpadded
	if (currencies.indexOf(current.code) !== -1) {
	    prev[current.code] = {
		currency: current.code,
		rates: {
		    ask: current.ask,
		    bid: current.bid
		}
	    };
	}
    }

    return prev;
  }, {});

  // check if all requested currencies are present in response
  if (currencies.length !== Object.keys(out).length)
    return callback(new Error('Unsupported currency'));

  callback(null, out);
}


exports.ticker = function ticker(currencies, callback) {
  if (typeof currencies === 'string')
    currencies = [currencies];

  if(currencies.length === 0)
    return callback(new Error('Currency not specified'));

  var urls = getTickerUrls(currencies);

  // change each url on the list into a download job
  var downloadList = urls.map(function(url) {
    return function(cb) {

      Wreck.get(url, {json: true}, function(err, res, payload) {
        cb(err, payload);
      });
    };
  });

  async.parallel(downloadList, function(err, results) {
    if (err) return callback(err);
	formatResponse(currencies, results, callback);
  });
};

