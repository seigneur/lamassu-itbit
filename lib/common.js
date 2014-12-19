'use strict';

var querystring = require('querystring');
var Wreck       = require('wreck');
var crypto      = require('crypto');
var _           = require('lodash');

//Itbit
var itBit = require('itbit');

// copy relevant convienient constants
var config          = require('../config');
var API_ENDPOINT    = config.API_ENDPOINT;
var NAME            = config.NAME;
var SATOSHI_FACTOR  = config.SATOSHI_FACTOR;


exports.authRequest = function authRequest(path, data, callback) {

  // TODO: check for credentials existance
 if (!config.key || !config.secret || !config.userId)
    return callback(new Error('Must provide key, secret and client ID to make this API request'));

  data = data || {};

var payload={};

var itBit = new ItBit({
    key: config.key,
    secret: config.secret,
    timeout: 20000  // milliseconds
});

if (path=='balance/'){
    itBit.getWallets(userId,
    function(err, wallets)
    {
        // for each wallet
        wallets.forEach(function(wallet)
        {
             // for each currency
            wallet.balances.forEach(function(balance){
		payload.btc_available += (balance.currency=='BTC'?balance.availableBalance:0);
		payload.usd_available += (balance.currency=='USD'?balance.availableBalance:0);
		payload.sgd_available += (balance.currency=='SGD'?balance.availableBalance:0);
                console.log('currency %s, total %s, available %s', balance.currency, balance.totalBalance, balance.availableBalance);
            });
        });
    }
);

}

if (path=='buy/')||(path=='sell/'){

    itBit.addOrder(walletId,  path.replace('/',''), "limit", data.amount, data.price, "XBTBTC", null, null,
      function(err, result){
          console.log('new order id ' + result.id);
          //check the result for the conditions 
          if(err)
       	    callback(err,null);
	  else
	    callback(null,result);
         }
       );
    }
};


// required by either Wallet or Trader
exports.balance = function balance(callback) {
  exports.authRequest('balance/', null, function(err, response) {
    if (err) return callback(err);
    callback(null, {
      USD: parseFloat(response.usd_available),
      BTC: Math.round(SATOSHI_FACTOR * parseFloat(response.btc_available))
    });
  });
};
