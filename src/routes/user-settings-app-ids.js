const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const router = express.Router()
const htmlTitle = 'Settings / App IDs'

router.route('/')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            return res.redirect('/settings')
        }

        //

        renderHtml(req, res, {}, [])
    })
    .post(async (req, res) => {

        //
        if(!req.session.user) {
            return res.send(':)')
        }

        //
        const errors = myMisc.validateOauthClient(
            req.body.name,
            req.body.ruri
        )

        if(errors.length > 0) {
            renderHtml(
                req,
                res,
                {
                    name: req.body.name,
                    ruri: req.body.ruri,
                },
                errors
            )
        }
        else {
            var {rows} = await db.createClient(
                req.body.name,
                req.body.ruri,
                req.session.user.user_id,
            )

            return res.redirect(`/settings/app-id?id=${rows[0].public_client_id}`)
        }
    })

module.exports = router

//
async function renderHtml(req, res, formData, errors, success) {
    const {rows:clients} = await db.getUserClients(req.session.user.user_id)

    //
    res.render(
        'my-settings-app-ids',
        {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            clients: clients,
            errors: errors,
            success: success,
            form_data: formData,
        })
}
