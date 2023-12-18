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
router.route('/authorize')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            const currUrl = req.protocol + '://' + req.get('host') + req.originalUrl
            const encodedCurrUrl = encodeURIComponent(currUrl)
            const redirectUrl = `/login?rurl=${encodedCurrUrl}`

            return res.redirect(redirectUrl)
        }

        //
        const {rows} = await db.getClient(req.query.client_id)

        //
        if(rows.length == 0) {
            return myMisc.renderMessage(req, res, authorizeHtmlTitle,
                "Unknown client ID.")
        }

        //
        return res.render(
            'oauth-authorize',
            {
                app_name: rows[0].app_name,
                html_title: authorizeHtmlTitle,
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })
    .post(async (req, res) => {

        //
        if(!req.session.user) {
            return res.send('bail')
        }

        //
        const cc = req.query.code_challenge
        const method = req.query.code_challenge_method
        const isCodeChallenge = typeof cc != 'undefined'
        const isCodeChallengeMethod = typeof method != 'undefined'

        if(!isCodeChallenge || !isCodeChallengeMethod) {
            return myMisc.renderMessage(req, res, authorizeHtmlTitle,
                `PKCE value(s) missing in URL`)
        }

        //
        const isValidCcMethod = method == 'plain' || method == 'S256'

        if(!isValidCcMethod) {
            return myMisc.renderMessage(req, res, authorizeHtmlTitle,
                `invalid code challenge method in URL`)
        }

        //
        const isPlain = method == 'plain'
        let isValidCc = false

        if(isPlain) {
            //check for 43 character code verifier
            const ccRegex = /^[-_\.~A-Z0-9]{43}$/i
            isValidCc = ccRegex.test(cc)
        }
        else {
            //check for 43 character sha256 base64 url encoded code verifier
            const ccRegex = /^[-_A-Z0-9]{43}$/i
            isValidCc = ccRegex.test(cc)
        }

        if(!isValidCc) {
            return myMisc.renderMessage(req, res, authorizeHtmlTitle,
                `invalid PKCE code challenge`)
        }

        //
        const request = new Request(req);
        const response = new Response(res);
        const options = {
            authenticateHandler: {
                handle: (req, res) => {

                    //get a copy of the user session
                    const user = JSON.parse(JSON.stringify(req.session.user));

                    //hijack user obj for PKCE values that saveAuthorizationCode needs
                    user.code_challenge = cc
                    user.code_challenge_method = method

                    //
                    return user
                }
            }
        }

        //
        oauth.authorize(request, response, options)
            .then((code) => {
                return res.redirect(response.headers.location)
            })
            .catch((error) => {
                return myMisc.renderMessage(req, res, authorizeHtmlTitle,
                    `The following error ocurred: ${error.message}`)
            })
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
