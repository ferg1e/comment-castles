const str = "cc]"
//const regex = /[^|]{5}/i
const regex = /[^\[\]]{3}/i
const res = str.match(regex)

console.log(res)
