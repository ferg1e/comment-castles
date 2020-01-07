const argon2 = require('argon2');
 
try {
  argon2.hash("test")
    .then((hash) => {console.log(hash)})
} catch (err) {
  console.log(err)
}