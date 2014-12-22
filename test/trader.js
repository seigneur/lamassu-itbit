/* global describe, it, before, afterEach */

'use strict';

var should        = require('chai').should();

var pluginConfig  = require('../config');


// re-reads *uncached* version of config JSON
function requireFresh(file) {
  delete require.cache[require.resolve(file)];
  return require(file);
}


var REQUIRED_MOCK_PROPERTIES = [
  'key',
  'secret',
  'clientId',
  'walletID'
];


if(pluginConfig.SUPPORTED_MODULES.indexOf('trader') !== -1 && !process.env.TRAVIS) {
  describe(pluginConfig.NAME + ' Trader', function() {
    var configMock = null;
    var traderPlugin = require('../index');

    describe('Mock config file', function() {

      it('`test/mockConfig.json` should exist', function() {
        should.not.Throw(function() {
          configMock = requireFresh('./mockConfig.json');
        });

        configMock.should.be.an('object');
      });

      if (REQUIRED_MOCK_PROPERTIES.length) {
        REQUIRED_MOCK_PROPERTIES.forEach(function(property) {
          it('should have \'' + property + '\' property', function() {
            configMock.should.have.property(property);
          });
        });
      }
    });

    describe('Credentials', function() {

      it('should have valid and activated API credentials', function(done) {
        should.not.Throw(function() {
          traderPlugin.config(requireFresh('./mockConfig.json'));
        });

        traderPlugin.balance(function(err) {
          should.not.exist(err);
          done();
        });
      });
    });

    describe('Requests', function() {

      var balance = null;
      var minimalAmount = NaN;
      var lastSgdPrice = NaN;


      // NOTE: this is Bitstamp-specific
      before(function(done) {
        traderPlugin.ticker('SGD', function(err, results) {
          lastSgdPrice = results.SGD.rates.ask;

          done(err);
        });
      });

      afterEach(function(done) {
        this.timeout(1500);

        // without it _some_ request _sometimes_ fail
        setTimeout(done, 777);
      });

      it('should return valid balance', function(done) {
        traderPlugin.balance(function(err, localBalance) {
	    console.log('BALANCE',localBalance);
          should.not.exist(err);
          localBalance.USD.should.be.a('number');
          isNaN(localBalance.USD).should.not.equal(true);

          localBalance.BTC.should.be.a('number');
          isNaN(localBalance.BTC).should.not.equal(true);

          balance = localBalance;

          done();
        });
      });

      describe('Buy', function() {
        // NOTE: [amount === 0] and [amount < $5] produce different errors
        it('should fail when amount is zero', function(done) {
          traderPlugin.purchase(0, {price:lastSgdPrice}, function(err) {
            should.exist(err);

            err.message.should.have.string('amount');

            done();
          });
        });

        it('should fail when amount too small', function(done) {

          // NOTE: minimum allowed order is $5;
          //       used '5.01' to accomodate possible price change
          minimalAmount = (2.01 * 1e8) / lastSgdPrice;
          var tooSmallAmount = minimalAmount / 3;

          traderPlugin.purchase(tooSmallAmount, {price:lastSgdPrice}, function(err) {
            should.exist(err);

            err.message.should.have.string('amount');

            done();
          });
        });

/*        it('should fail when provided price is too high', function(done) {

          var tooHighPrice = lastSgdPrice * 1.2;

          traderPlugin.purchase(minimalAmount, {price:tooHighPrice}, function(err) {
            should.exist(err);

            err.message.should.have.string('20%');

            done();
          });
        });
//Itbit does not provide this error, plugin side validation is possible but not applied. 

*/
        it('should have at least $2 on account', function() {
          balance.SGD.should.be.above(2);

        });

        it('should successfully place order', function(done) {
          traderPlugin.purchase(minimalAmount, {price:lastSgdPrice}, function(err) {
            should.not.exist(err);

            done();
          });
        });
      });

      describe('Sell', function() {
        // NOTE: [amount === 0] and [amount < $5] produce different errors
        it('should fail when amount is zero', function(done) {
          traderPlugin.sell(0, {price:lastSgdPrice}, function(err) {
            should.exist(err);

            err.message.should.have.string('amount');

            done();
          });
        });

        it('should fail when amount too small', function(done) {

          // NOTE: minimum allowed order is $5;
          //       used '5.01' to accomodate possible price change
          minimalAmount = (2.01 * 1e8) / lastSgdPrice;
          var tooSmallAmount = minimalAmount / 3;

          traderPlugin.sell(tooSmallAmount, {price:lastSgdPrice}, function(err) {
            should.exist(err);

            err.message.should.have.string('amount');

            done();
          });
        });

        it('should have at least $2 *in BTC* on account', function() {
          (balance.BTC/1e8).should.be.above(2/lastSgdPrice);

        });

        it('should successfully place order', function(done) {
          traderPlugin.sell(minimalAmount, {price:lastSgdPrice}, function(err) {
            should.not.exist(err);

            done();
          });
        });
      });

    });
  });
}
