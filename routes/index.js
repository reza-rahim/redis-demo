var express = require('express');
var router = express.Router();

var chunk = require('chunk');
var Redis = require('../models/redis');
var Cart = require('../models/cart');
var redisClient = Redis.redisClient
var hgetallAsync = Redis.hgetallAsync
var sortAsync = Redis.sortAsync

/* From the redis data base -- */
router.get('/', function(req, res, next) {
     var successMgs = req.flash('success')[0];
     console.log(req.session)
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
});

router.get('/add-to-cart/:id', function (req, res) {
    var productId = req.params.id;
    var cart = new Cart(req.session.cart ? req.session.cart : {});


    redisClient.hgetall("redisshop:product:"+productId,function (err, product){

       if(err) {
            return res.redirect('/');
       }
       cart.add(product, product.id);
console.log("  ")
       req.session.cart = cart;
       res.redirect('/');
    });

/*
    Product.findById(productId, function (err, product) {
        if(err) {
            return res.redirect('/');
        }
        cart.add(product, product.id);
        req.session.cart = cart;
        console.log(req.session.cart);
        res.redirect('/');
    })
*/
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
    var cart = new Cart(req.session.cart);


    stripe.charges.create({
        amount: cart.totalPrice * 100,
        currency: "usd",
        source: req.body.stripeToken, // obtained with Stripe.js
        description: "Test Charge"
    }, function(err, charge) {
        if(err) {
            req.flash('error', err.message);
            return res.redirect('/checkout');
        }
        var order = new Order({
            user: req.user,
            cart: cart,
            address: req.body.address,
            name: req.body.name,
            paymentId: charge.id
        });
        order.save(function(err, result) {
            req.flash('success', 'Successfully bought product!');
            req.session.cart = null;
            res.redirect('/');
        });
    });
});

module.exports = router;

function isLoggedIn(req, res, next) {
    if(req.isAuthenticated()) {
        return next();
    }
    req.session.oldUrl = req.url;
    res.redirect('/user/signin');
}
