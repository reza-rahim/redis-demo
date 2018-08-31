var Redis = require('../models/redis');
var chunk = require('chunk');
var redisClient = Redis.redisClient
var hgetallAsync = Redis.hgetallAsync
var sortAsync = Redis.sortAsync

function  format(reply){
     var prodsChunks = chunk(reply,5)
     var products = []
     prodsChunks.forEach(function(itemData,index) {
        var product = {}
        product._id = itemData[0]
        product.imagePath = itemData[1]
        product.title = itemData[2]
        product.description = itemData[3]
        product.price = itemData[4]

        products[index] = product
     });
     var productChunks = []
     var chunkSize = 3;
     for (var i = 0; i < products.length; i += chunkSize) {
         productChunks.push(products.slice(i, i  + chunkSize));
     }
     return productChunks;
}

const getAll =  async function getAll () {
    var reply= await sortAsync("redisshop:all-products",
                 "BY",  "redisshop:product:*->price",
                 "get", "#",
                 "get",  "redisshop:product:*->imagePath",
                 "get",  "redisshop:product:*->title",
                 "get",  "redisshop:product:*->description",
                 "get",  "redisshop:product:*->price");
    
    var productChunks = await format(reply)
    return productChunks
}

module.exports.getAll = getAll
//module.exports.getById = getById
