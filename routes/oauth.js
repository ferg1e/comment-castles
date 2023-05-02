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
        },

        getAuthorizationCode: async (authorizationCode) => {

            //
            const {rows} = await db.getAuthCode(authorizationCode)

            //
            if(rows.length > 0) {
                const row = rows[0]

                return {
                    code: authorizationCode,
                    expiresAt: new Date(row.expires_on),
                    redirectUri: row.redirect_uri,
                    client: {
                        id: row.public_client_id,
                    },
                    user: {
                        user_id: row.logged_in_user_id,
                    },
                }
            }
        },

        revokeAuthorizationCode: async (codeObj) => {
            await db.deleteAuthCode(codeObj.code)
            return true
        },

        saveToken: async (token, client, user) => {

            //
            await db.createAccessToken(
                client.privateId,
                user.user_id,
                token.accessToken,
                token.accessTokenExpiresAt)

            //
            return {
                accessToken: token.accessToken,
                accessTokenExpiresAt: new Date(token.accessTokenExpiresAt),
                client: client,
                user: user,
            }
        },
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

//
router.route('/token')
    .post(async (req, res) => {

        //
        const request = new Request(req);
        const response = new Response(res);
        const options = {
            requireClientAuthentication: {
                authorization_code: false
            }
        }

        //
        oauth.token(request, response, options)
            .then((token) => {
                res.set(response.headers)
                res.status(response.status)
                return res.send(response.body)
            })
            .catch((error) => {
                return res.send(error)
            })
    })

module.exports = router
