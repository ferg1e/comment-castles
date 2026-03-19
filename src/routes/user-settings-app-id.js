const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {isUser} = require('../middleware/is-user.js')
const {checkOauthClient} = require('../middleware/check-oauth-client.js')

//
const router = express.Router()
const htmlTitle = 'Settings / App ID'

//
const get = async (req, res) => {

    //
    const oauthClient = res.locals.oauthClient

    //
    if(oauthClient.user_id != req.session.user.user_id) {
        return res.send('wrong user')
    }

    //
    renderHtml(req, res, oauthClient)
}

//
const post = async (req, res) => {

    //
    const oauthClient = res.locals.oauthClient

    //
    if(oauthClient.user_id != req.session.user.user_id) {
        return res.send('wrong user')
    }

    //
    const errors = myMisc.validateOauthClient(
        req.body.name,
        req.body.ruri
    )

    const updatedRow = {
        public_client_id: oauthClient.public_client_id,
        app_name: req.body.name,
        redirect_uri: req.body.ruri
    }

    if(errors.length > 0) {
        renderHtml(req, res, updatedRow, errors)
    }
    else {
        await db.updateClient(
            oauthClient.client_id,
            req.body.name,
            req.body.ruri)
        
        renderHtml(
            req,
            res,
            updatedRow,
            [],
            'app info saved')
    }
}

//
router.get('/', isUser, checkOauthClient, get)
router.post('/', isUser, checkOauthClient, post)
module.exports = router

//
function renderHtml(req, res, client, errors, success) {
    res.render(
        'my-settings-app-id',
        {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            errors: errors,
            success: success,
            client: client,
        })
}
