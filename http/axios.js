const axios = require('axios')

const getBreeds = async () => {
  try {
    return await axios.get('https://dog.ceo/api/breeds/list/all')
  } catch (error) {
    console.error(error)
  }
}

const countBreeds = async () => {
  const breeds = await getBreeds()

  if (breeds.data.message) {
    console.log(`Got ${Object.entries(breeds.data.message).length} breeds`)
  }
}

//countBreeds()


async function getOrder(){
let user='reza@redislabs.com'

var instance =  axios.create({
  baseURL: 'http://10.0.16.10:3000/getOrders?user='+user,
  timeout: 3000,
  headers: {'X-Custom-Header': 'foobar'}
});

//var data = await  instance.get()
instance.get().then( function (res){
     console.log(res.data)
})

}

getOrder()

