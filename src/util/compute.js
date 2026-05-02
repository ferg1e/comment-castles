const {URL} = require('url')

//
module.exports.getDomainName = link => {
    const myUrl = new URL(link)
    return myUrl.hostname.replace(/^(www\.)/, '')
}

//
module.exports.numToOrderedAlpha = num => {
    var first = Math.ceil(num/676)

    var second = Math.ceil(num/26)%26
    second = second ? second : 26

    var third = Math.ceil(num%26)
    third = third ? third : 26

    return String.fromCharCode(96 + first) +
        String.fromCharCode(96 + second) +
        String.fromCharCode(96 + third)
}
