'use strict';

var common      = require('./common');
var ticker      = require('./ticker').ticker;

// copy relevant convienient constants
var config          = require('../config');
var SATOSHI_FACTOR  = config.SATOSHI_FACTOR;
var FUDGE_FACTOR    = config.FUDGE_FACTOR;

function getProperPrice(price, type, callback) {

  if (price !== null) {
    if (typeof price === 'string') {
      try {
        price = parseFloat(price);
      } catch(e) {
        return callback(new Error('invalid price'));
      }
    }

    return callback(null, price.toFixed(2));
  }

  ticker('SGD', function(err, response) {
    if (err) return callback(err);

    price = response.SGD.rates[type];

    if (type === 'ask') price *= FUDGE_FACTOR;
    else price /= FUDGE_FACTOR;

    callback(null, price.toFixed(2));
  });
}


exports.purchase = function purchase(satoshis, opts, callback) {
  var options = {
    type: 'buy',
    amount: satoshis
  };

  getProperPrice(opts && opts.price, 'ask', function(err, price) {
    if (err) return callback(err);

    options.price = price;
    trade(options, callback);
  });
};

exports.sell = function sell(satoshis, opts, callback) {
  var options = {
    type: 'sell',
    amount: satoshis
  };

  getProperPrice(opts && opts.price, 'bid', function(err, price) {
    if (err) return callback(err);

    options.price = price;

    trade(options, callback);
  });
};



function processError(response) {
  var errors = response.error.__all__;
  var err = new Error(errors.join('; '));
  if (errors.length === 1 && errors[0].indexOf('Minimum order size') !== -1)
    err.name = 'orderTooSmall';
  return err;
}

function trade(opts, callback) {
  common.authRequest(opts.type + '/', {
    amount: (opts.amount / SATOSHI_FACTOR).toFixed(8),
    price: opts.price

  }, function(err, response) {
    if (err) return callback(err);

    if (response.error)
      return callback(processError(response));

    callback(null, response);
  });
}
