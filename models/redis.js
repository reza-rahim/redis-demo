
var redis = require('redis');
var chunk = require('chunk');
const bluebird = require("bluebird");
var redisClient = redis.createClient({host : 'localhost', port : 6379});

const {promisify} = require('util');
const hgetallAsync = promisify(redisClient.hgetall).bind(redisClient);
const sortAsync = promisify(redisClient.sort).bind(redisClient);
const smembersAsync = promisify(redisClient.smembers).bind(redisClient);

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

module.exports.redisClient =  redisClient
module.exports.hgetallAsync =  hgetallAsync
module.exports.sortAsync =  sortAsync
module.exports.smembersAsync =  smembersAsync


