const express = require('express')
const OAuth2Server = require('oauth2-server')
const Request = require('oauth2-server').Request
const Response = require('oauth2-server').Response
const db = require('../db')
const myMisc = require('../misc.js')
const config = require('../config')

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
            return res.render(
                'message',
                {
                    html_title: authorizeHtmlTitle,
                    message: "Unknown client ID.",
                    user: req.session.user,
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
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
