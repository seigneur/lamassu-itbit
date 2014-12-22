'use strict';

var _ = require('lodash');

exports.NAME = 'Itbit';
exports.SUPPORTED_MODULES = ['ticker','trader'];
exports.API_ENDPOINT = 'https://api.itbit.com/v1/markets/';

exports.SATOSHI_FACTOR = 1e8;
exports.FUDGE_FACTOR = 1.0;

exports.config = function config(localConfig) {
  if (localConfig) _.merge(exports, localConfig);
};
