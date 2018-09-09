var Redis = require('../models/redis');
var chunk = require('chunk');
var redisClient = Redis.redisClient

async function  getProductsSort() {
    let productView = []
    let products = await redisClient.sortAsync("redisshop:all-products",
                 "BY",  "redisshop:product:*->price",
                 "get", "#",
                 "get",  "redisshop:product:*->imagePath",
                 "get",  "redisshop:product:*->title",
                 "get",  "redisshop:product:*->description",
                 "get",  "redisshop:product:*->price");

    let prodsChunks = chunk(products,5)

    prodsChunks.forEach(function(itemData,index) {
        var product = {}
        product._id = itemData[0]
        product.imagePath = itemData[1]
        product.title = itemData[2]
        product.description = itemData[3]
        product.price = itemData[4]

        productView.push(product)
    });

    //console.log(productView)
    return productView;
}

async function  getProducts() {
   // with multi exec 
     let productsIdx= await redisClient.zrevrangeAsync('redisshop:all-productsSorted',0,10);
     let mul = redisClient.multi();
     let productView = []

     productsIdx.forEach(function(product) {
        console.log(product)
        mul.hmget('redisshop:product:'+product,'id','imagePath','title','description','price');
     });

     let products = await mul.execAsync()

     products.forEach(function (product){
        //console.log(product)
        let productObj = {}
        productObj._id = product[0]
        productObj.imagePath = product[1]
        productObj.title = product[2]
        productObj.description = product[3]
        productObj.price = product[4]
        productView.push(productObj)
     })

     //console.log(productView)
     return productView;
}

module.exports.getProducts = getProducts
module.exports.getProductsSort = getProductsSort
