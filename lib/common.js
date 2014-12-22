'use strict';

var querystring = require('querystring');
var Wreck       = require('wreck');
var crypto      = require('crypto');
var _           = require('lodash');

//Itbit
var ItBit = require('itbit');

// copy relevant convienient constants
var config          = require('../config');
var API_ENDPOINT    = config.API_ENDPOINT;
var NAME            = config.NAME;
var SATOSHI_FACTOR  = config.SATOSHI_FACTOR;


exports.authRequest = function authRequest(path, data, callback) {

  // TODO: check for credentials existance
 if (!config.key || !config.secret || !config.clientId || !config.walletID)
    return callback(new Error('Must provide key, secret and client ID to make this API request'));

  data = data || {};

var payload={};

var itBit = new ItBit({
    key: config.key,
    secret: config.secret,
    timeout: 50000  // milliseconds
});

if (path=='balance/'){
var payload={"btc_available":0,"usd_available":0,"sgd_available":0};
    itBit.getWallet(config.walletID,
    function(err, wallet)
    {
	if(err) callback(err,null);
            wallet.balances.forEach(function(balance){
		payload.btc_available += (balance.currency=='XBT'?balance.availableBalance:0);
		payload.usd_available += (balance.currency=='USD'?balance.availableBalance:0);
		payload.sgd_available += (balance.currency=='SGD'?balance.availableBalance:0);
            });

      callback(err,payload);
  }
);

}

if ((path == 'buy/') || (path == 'sell/')){
//since this is for the local Lamassu, use SGD wallet
if (data.amount < 0.004)
   return callback(new Error('amount too small'),null);
else if (data.amount == 0.00)
   return callback(new Error('amount is zero'),null);
else{
var amount = parseFloat(data.amount);
itBit.addOrder(config.walletID, path.replace('/',''), "limit", amount.toFixed(4), data.price, "XBTSGD", null, null,
	       function(err, itbitResp){        
		   //console.log(itbitResp);                                                                  		
		   if(err)
		       callback(err,null);
		   else
		       callback(null,itbitResp);    
	       }
	      );
    
}
}
};


// required by either Wallet or Trader
exports.balance = function balance(callback) {
  exports.authRequest('balance/', null, function(err, response) {
    if (err) return callback(err);
//      console.log('Response::::::::',response);
    callback(null, {	
      SGD: parseFloat(response.sgd_available),
      USD: parseFloat(response.usd_available),
      BTC: Math.round(SATOSHI_FACTOR * parseFloat(response.btc_available))
    });
  });
};
