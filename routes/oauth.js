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
        getClient: async (clientId, clientSecret) => {

            //
            const {rows} = await db.getClient(clientId)

            //
            if(rows.length > 0) {
                return {
                    privateId: rows[0].client_id,
                    id: clientId,
                    redirectUris: [rows[0].redirect_uri],
                    grants: ['authorization_code'],
                }
            }
        },

        saveAuthorizationCode: async (code, client, user) => {

            //
            await db.createAuthCode(
                client.privateId,
                user.user_id,
                code.authorizationCode,
                code.redirectUri,
                code.expiresAt)

            //
            return {
                authorizationCode: code.authorizationCode,
                expiresAt: code.expiresAt,
                redirectUri: code.redirectUri,
                client: client,
                user: user,
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
