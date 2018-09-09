var Redis = require('../models/redis');
var HashMap = require('hashmap');

async function getOrders(user) {
  let redisClient = Redis.redisClient

  let orderView = []

  let  ordersHash = new HashMap();
  let ordersRedis = await redisClient.smembersAsync('all-orders:'+user);

  //console.log('ordersRedis', ordersRedis.toString());

  let mulOrder = redisClient.multi();
  let mulCarts = redisClient.multi();

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

  let cartsRedis = await mulCarts.execAsync()

  let mulCartsDetail = redisClient.multi();

  cartsRedis.forEach(function(carts) {
    carts.forEach(function(cart) {
       mulCartsDetail.hmget('carts:'+cart, 'user', 'orderNumber', 'cart','id', 'title', 'qty', 'price')
    })
  })

  let allcarts = await mulCartsDetail.execAsync()
  //console.log('carts:', allcarts);

  allcarts.forEach(function(cart){
     let cartObj = {}
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

  //console.log(orderView)
  return orderView
}

module.exports.getOrders =  getOrders
