var redis = require("redis")
var uuidv4 = require('uuid/v4')
const client = redis.createClient()
 
// if you'd like to select database 3, instead of 0 (default), call
// client.select(3, function() { /* ... */ });
 
client.on("error", function (err) {
    console.log("Error " + err)
})

console.log('here')
console.log(uuidv4())
//console.log(client)
