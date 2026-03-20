const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {isUser} = require('../middleware/is-user.js')
const {checkOauthClient} = require('../middleware/check-oauth-client.js')

//
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
    return renderHtml(req, res, oauthClient)
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
        return renderHtml(req, res, updatedRow, errors)
    }

    //
    await db.updateClient(
        oauthClient.client_id,
        req.body.name,
        req.body.ruri)
    
    return renderHtml(
        req,
        res,
        updatedRow,
        [],
        'app info saved')
}

//
const router = express.Router()
router.get('/', isUser, checkOauthClient, get)
router.post('/', isUser, checkOauthClient, post)
module.exports = router

//
function renderHtml(req, res, client, errors, success) {
    return res.render('my-settings-app-id', {
        html_title: htmlTitle,
        user: req.session.user,
        max_width: myMisc.getCurrSiteMaxWidth(req),
        errors: errors,
        success: success,
        client: client,
    })
}
