const express = require('express')
const OAuth2Server = require('oauth2-server')
const Request = require('oauth2-server').Request
const Response = require('oauth2-server').Response
const db = require('../db')
const myMisc = require('../misc.js')
const config = require('../config')

const router = express.Router()

//
const oauth = new OAuth2Server({
    model: {
        getClient: (clientId, clientSecret) => {
            return {
                id: "mybigfakeid",
                redirectUris: ['http://localhost:6007'],
                grants: ['authorization_code'],
            }
        },

        saveAuthorizationCode: (code, client, user) => {
            return {
                authorizationCode: code.authorizationCode,
            }
        },

        getAccessToken: (accessToken) => {
            return {
                accessToken: accessToken,
            }
        }
    }
})

//
router.route('/authorize')
    .get(async (req, res) => {

        //
        const request = new Request(req);
        const response = new Response(res);
        const options = {
            authenticateHandler: {
                handle: (req, res) => {
                    return req.session.user
                }
            }
        }

        //
        oauth.authorize(request, response, options)
            .then((code) => {
                return res.redirect(response.headers.location)
            })
            .catch((error) => {
                return res.send(error)
            })
    })

module.exports = router
