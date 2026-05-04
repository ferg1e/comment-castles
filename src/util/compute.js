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

//
exports.orderedAlphaToNum = oAlpha => {
    const rightChar = oAlpha.substring(2, 3)
    const rightValue = rightChar.charCodeAt() - 96

    const middleChar = oAlpha.substring(1, 2)
    const middleValue = 26*(middleChar.charCodeAt() - 97)

    const leftChar = oAlpha.substring(0, 1)
    const leftValue = 26*26*(leftChar.charCodeAt() - 97)

    return rightValue + middleValue + leftValue
}
