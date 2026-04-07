const express = require('express')
const OAuth2Server = require('oauth2-server')
const Request = require('oauth2-server').Request
const Response = require('oauth2-server').Response
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')
const crypto = require('crypto')

const router = express.Router()
const authorizeHtmlTitle = "Authorize App"

//
const oauth = new OAuth2Server({
    model: require('../oauth-model.js')
})

//
router.route('/token')
    .post(async (req, res) => {

        /*
        --start PKCE check--
        only emit PKCE errors here
        because oauth.token() after will
        handle the rest.
        */
        const clientId = req.body.client_id
        const redirectUri = req.body.redirect_uri
        const authCode = req.body.code
        const isReadyForPkceCheck =
            typeof clientId != 'undefined' &&
            typeof redirectUri != 'undefined' &&
            typeof authCode != 'undefined'

        if(isReadyForPkceCheck) {
            const {rows:[dbAuthCode]} = await db.getAuthCode(authCode)

            //
            if(dbAuthCode) {
                const isRecordMatch = dbAuthCode.public_client_id == clientId &&
                    dbAuthCode.redirect_uri == redirectUri
                
                //
                if(isRecordMatch) {
                    const codeVerifier = req.body.code_verifier

                    //
                    if(typeof codeVerifier == 'undefined') {
                        return res.status(400).json({
                            errors: ['no code_verifier in body'],
                        })
                    }

                    //
                    let isGoodPkce = false

                    if(dbAuthCode.cc_method == 'plain') {
                        isGoodPkce = dbAuthCode.code_challenge == codeVerifier
                    }
                    else {
                        const nowHash = crypto
                            .createHash('sha256')
                            .update(codeVerifier)
                            .digest('base64')
                            .replace(/=/g, '')
                            .replace(/\+/g, '-')
                            .replace(/\//g, '_')

                        isGoodPkce = dbAuthCode.code_challenge == nowHash
                    }

                    if(!isGoodPkce) {
                        return res.status(400).json({
                            errors: ['invalid PKCE code verifier'],
                        })
                    }
                }
            }
        }
        //--end PKCE check--

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
                return res.json(response.body)
            })
            .catch((error) => {
                return res.status(400).json({
                    errors: [`the following error ocurred: ${error.message}`],
                })
            })
    })

module.exports = router
