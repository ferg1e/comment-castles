const OAuth2Server = require('oauth2-server')
const Request = require('oauth2-server').Request
const Response = require('oauth2-server').Response

module.exports.oauthAuthenticate = async (req, res) => {

    //
    const oauth = new OAuth2Server({
        model: require('../oauth-model.js')
    })

    //
    const request = new Request(req)
    const response = new Response(res)
    const options = {}
    let oauthData = null

    try {
        oauthData = await oauth.authenticate(request, response, options)
    }
    catch(e) {
        // basically no access token in header
        // or wrong access token in header
        // either way, do nothing and proceed
        // with API call render
    }

    return oauthData
}
