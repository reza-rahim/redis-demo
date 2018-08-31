var redis = require('redis');
var chunk = require('chunk');
var redisClient = redis.createClient({host : 'localhost', port : 6379});
const {promisify} = require('util');
const getAsync = promisiofy(redisClient.get).bind(redisClient);


const hgetallAsync = promisify(redisClient.hgetall).bind(redisClient);

var rk          = require('rk'), 
    keyRoot     = 'redishop', 
    product       = rk(keyRoot,'product','*');
               
redisClient.hgetall("redisshop:product:vans",function (err, reply){
                      console.log(reply.imagePath)
                    }); 



redisClient.hgetallAsync('redisshop:product:vans').then(function (result) { console.log(result); });



async function myFunc() { const res = await getAsync('foo'); console.log(res); }

redisClient.sort("redisshop:all-products", 
                 "BY",  "redisshop:product:*->price",
                 "get", "#",
                 "get",  "redisshop:product:*->imagePath",
                 "get",  "redisshop:product:*->title",
                 "get",  "redisshop:product:*->description",
                 "get",  "redisshop:product:*->price",function (err, reply){
                      var prods = chunk(reply,5)
                      var products = []
                      prods.forEach(function(itemData,index) { 
                             var product = {}
                             product.key = itemData[0]
                             product.imagePath = itemData[1]
                             product.title = itemData[2]
                             product.description = itemData[3]
                             product.price = itemData[4]

                             products[index] = product
                             //console.log(product)
                      });

                    });

/*
redisClient.multi().sort(rk(keyRoot,'all-products'), 
                    'BY', product+'->price',
                    'GET', '#', 
                    'GET', product+'->price',   
                    'GET', product+'->imagePath'
               )
               .exec(function(err,multiResponses) {
                    var productData        = multiResponses[0]
                    console.log(productData)
               });
*/
//module.exports.products =  products

redisClient.quit()
