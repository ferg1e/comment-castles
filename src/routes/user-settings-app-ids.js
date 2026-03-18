const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {isUser} = require('../middleware/is-user.js')

//
const router = express.Router()
const htmlTitle = 'Settings / App IDs'

//
const get = async (req, res) => renderHtml(req, res, {}, [])

//
const post = async (req, res) => {

    //
    const errors = myMisc.validateOauthClient(
        req.body.name,
        req.body.ruri
    )

    if(errors.length > 0) {
        return renderHtml(
            req,
            res,
            {
                name: req.body.name,
                ruri: req.body.ruri,
            },
            errors
        )
    }

    //
    var {rows} = await db.createClient(
        req.body.name,
        req.body.ruri,
        req.session.user.user_id,
    )

    return res.redirect(`/settings/app-id?id=${rows[0].public_client_id}`)
}

//
router.get('/', isUser, get)
router.post('/', isUser, post)
module.exports = router

//
async function renderHtml(req, res, formData, errors, success) {
    const {rows:clients} = await db.getUserClients(req.session.user.user_id)

    //
    return res.render('my-settings-app-ids', {
        html_title: htmlTitle,
        user: req.session.user,
        max_width: myMisc.getCurrSiteMaxWidth(req),
        clients: clients,
        errors: errors,
        success: success,
        form_data: formData,
    })
}
