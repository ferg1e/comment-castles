const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')
const OAuth2Server = require('oauth2-server')
const Request = require('oauth2-server').Request
const Response = require('oauth2-server').Response

//
const router = express.Router()

//
const oauth = new OAuth2Server({
    model: require('../oauth-model.js')
})

//
router.get('/posts', require('./api-get-posts'))

//
router.get('/sub/posts', require('./api-get-sub-posts'))

//
router.get('/post', require('./api-get-post'))

//
router.post('/post', require('./api-post-post'))

// edit post
router.put('/post', require('./api-put-post'))

// delete post
router.delete('/post', require('./api-delete-post'))

//
router.get('/comment', require('./api-get-comment'))

//
router.post('/comment', require('./api-post-comment'))

// edit comment
router.put('/comment', require('./api-put-comment'))

// delete comment
router.delete('/comment', require('./api-delete-comment'))

//
module.exports = router

//
async function oauthAuthenticate(req, res) {
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
