var Redis = require('../models/redis');
var HashMap = require('hashmap');

async function getOrders() {
  var redisClient = Redis.redisClient

  var user="reza@redislabs.com"
  //let orders = []
  let orderView = []

  var  ordersHash = new HashMap();
  let ordersRedis = await redisClient.smembersAsync('all-orders:'+user);

  //console.log('ordersRedis', ordersRedis.toString());

  var mulOrder = redisClient.multi();
  var mulCarts = redisClient.multi();

  ordersRedis.forEach(function(order) {
     mulOrder.hmget('orders:'+order, 'user', 'orderNumber', 'totalQty','totalPrice')
     mulCarts.smembersAsync('all-carts:'+order)
  })

  let allorders = await mulOrder.execAsync()

  allorders.forEach(function(order) {
     orderObj = {}
     orderObj.items = []
     orderObj.user =order[0]
     orderObj.orderNumber =order[1]
     orderObj.totalQty =order[2]
     orderObj.totalPrice =order[3]
     ordersHash.set(orderObj.orderNumber, orderObj)
  })
  //console.log('ordersRedis', allorders );

  let cartsRedis = await mulCarts.execAsync()
  //console.log('cartsRedis', cartsRedis);

  var mulCartsDetail = redisClient.multi();

    //console.log('cartsRedis', cartsRedis);

  var mulCartsDetail = redisClient.multi();
  cartsRedis.forEach(function(carts) {
    carts.forEach(function(cart) {
       mulCartsDetail.hmget('carts:'+cart, 'user', 'orderNumber', 'cart','id', 'title', 'qty', 'price')
       //console.log('carts:'+cart)
    })
  })

  let allcarts = await mulCartsDetail.execAsync()
  //console.log('carts:', allcarts);

  allcarts.forEach(function(cart){
     var cartObj = {}
     cartObj.user=cart[0]
     cartObj.orderNumber=cart[1]
     cartObj.cart=cart[2]
     cartObj.id=cart[3]
     cartObj.title=cart[4]
     cartObj.qty=cart[5]
     cartObj.price=cart[6]
     ordersHash.get(cart[1]).items.push(cartObj)
  })

  ordersHash.forEach(function(value, key) {
    orderView.push(value)
  });

  console.log(orderView)
  return orderView
}

module.exports.getOrders =  getOrders
