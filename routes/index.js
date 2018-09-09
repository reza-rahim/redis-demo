var express = require('express');
var router = express.Router();

var chunk = require('chunk');
var Redis = require('../models/redis');
var Products = require('../models/product');
var moment = require('moment');
var redisClient = Redis.redisClient

/* From the redis data base -- */
router.get('/', function(req, res, next) {
    var successMgs = req.flash('success')[0];
     
/*---------------*/
     // with multi exec 
     redisClient.zrevrange('redisshop:all-productsSorted',0,10, function(err, products) {
        var mul = redisClient.multi();
        products.forEach(function(product) {
           mul.hmget('redisshop:product:'+product,'id','imagePath','title','description','price');
        });

        mul.exec(function(err,allResponses) {  
           var products = []
           allResponses.forEach(function (itemData){
              var product = {}
              product._id = itemData[0]
              product.imagePath = itemData[1]
              product.title = itemData[2]
              product.description = itemData[3]
              product.price = itemData[4]
              products.push(product)
           })

           var productChunks = [];
           var chunkSize = 3;
           for (var i = 0; i < products.length; i += chunkSize) {
                productChunks.push(products.slice(i, i  + chunkSize));
           }
           res.render('shop/index', { title: 'Shopping cart', products: productChunks, successMgs: successMgs, noMessage: !successMgs });
        });
     });
/*------------- */

/* ---------------
     //with sort command
     sortAsync("redisshop:all-products",
                 "BY",  "redisshop:product:*->price",
                 "get", "#",
                 "get",  "redisshop:product:*->imagePath",
                 "get",  "redisshop:product:*->title",
                 "get",  "redisshop:product:*->description",
                 "get",  "redisshop:product:*->price").then (function (reply){
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
                             //console.log(product)
                      });

                      var productChunks = [];
                      var chunkSize = 3;
                      for (var i = 0; i < products.length; i += chunkSize) {
                         productChunks.push(products.slice(i, i  + chunkSize));
                      }
                      res.render('shop/index', { title: 'Shopping cart', products: productChunks, successMgs: successMgs, noMessage: !successMgs });

                    });
---------------- */
});

router.get('/add-to-cart/:id', function (req, res) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});

    redisClient.hgetall("redisshop:product:"+productId,function (err, product){

       if(err) {
            return res.redirect('/');
       }
       cart.add(product, product.id);
       req.session.cart = cart;
       res.redirect('/');
    });

});

router.get('/reduce/:id', function (req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    cart.reduceByOne(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});

router.get('/remove/:id', function (req, res, next) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});
    cart.removeItem(productId);
    req.session.cart = cart;
    res.redirect('/shopping-cart');
});

router.get('/shopping-cart', function (req, res, next) {
    if(!req.session.cart) {
        return res.render('shop/shopping-cart', {products: null});
    }
    var cart = new Cart(req.session.cart);
    //console.log(req.session.cart)
    //console.log(cart.generateArray())
    return res.render('shop/shopping-cart', {products: cart.generateArray(), totalPrice: cart.totalPrice});
});

router.get('/checkout', isLoggedIn, function (req, res, next) {
    if(!req.session.cart) {
        return res.redirect('/shopping-cart');
    }
    var cart = new Cart(req.session.cart);
    var errMsg = req.flash('error')[0];
    return res.render('shop/checkout', {total: cart.totalPrice, errMsg: errMsg, noError: !errMsg});
});

router.post('/checkout', isLoggedIn, function(req, res, next) {
    if(!req.session.cart) {
        return res.redirect('/shopping-cart');
    }

    cartSess = new Cart(req.session.cart);
    cartArr = cartSess.generateArray();
    var orderNumber = moment().unix()

    var mul =redisClient.multi()

    mul.hmset("orders:"+req.user.email+':'+orderNumber, 
                      "user",req.user.email,"orderNumber", orderNumber, 
                      "name", req.body.name, "address", req.body.address, 
                      "totalQty", cartSess.totalQty, "totalPrice", cartSess.totalPrice )

    mul.sadd("all-orders:"+req.user.email,req.user.email+":"+orderNumber)

    cartArr.forEach(function(cart){
      
         mul.hmset("carts:"+req.user.email+':'+orderNumber+":"+cart.item.id, 
                           "user",req.user.email,"orderNumber", orderNumber, "cart", cart.item.id,
                           "id", cart.item.id,"title", cart.item.title, 
                           "qty",cart.qty, "price", cart.price )
         mul.sadd("all-carts:"+req.user.email+":"+orderNumber, req.user.email+":"+orderNumber+":"+cart.item.id )

    })

    mul.exec(function (err, replies) {
    });

    //var cart = new Cart(req.session.cart);
    req.flash('success', 'Successfully bought product!');
    req.session.cart = null;
    res.redirect('/');
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}
