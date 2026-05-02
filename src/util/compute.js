const {URL} = require('url')

//
module.exports.getDomainName = link => {
    const myUrl = new URL(link)
    return myUrl.hostname.replace(/^(www\.)/, '')
}
