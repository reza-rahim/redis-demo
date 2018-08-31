
var redis = require('redis');
var chunk = require('chunk');
var redisClient = redis.createClient({host : 'localhost', port : 6379});

const {promisify} = require('util');
const hgetallAsync = promisify(redisClient.hgetall).bind(redisClient);
const sortAsync = promisify(redisClient.sort).bind(redisClient);


module.exports.redisClient =  redisClient
module.exports.hgetallAsync =  hgetallAsync
module.exports.sortAsync =  sortAsync


