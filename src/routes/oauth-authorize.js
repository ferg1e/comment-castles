const express = require('express')
const OAuth2Server = require('oauth2-server')
const Request = require('oauth2-server').Request
const Response = require('oauth2-server').Response
const db = require('../db')
const myMisc = require('../util/misc.js')
const {render400, render404} = require('../util/render')

//
const authorizeHtmlTitle = "Authorize App"

//
const oauth = new OAuth2Server({
    model: require('../oauth-model.js')
})

//
const get = async (req, res) => {

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
        return render404(res, 'Unknown client ID')
    }

    //
    return res.render('oauth-authorize', {
        app_name: rows[0].app_name,
        html_title: authorizeHtmlTitle,
        user: req.session.user,
        max_width: myMisc.getCurrSiteMaxWidth(req)
    })
}

//
const post = async (req, res) => {

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
        return render400(res, `PKCE value(s) missing in URL`)
    }

    //
    const isValidCcMethod = method == 'plain' || method == 'S256'

    if(!isValidCcMethod) {
        return render400(res, `Invalid code challenge method in URL`)
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
}

//
const router = express.Router()
router.get('/', get)
router.post('/', post)
module.exports = router
