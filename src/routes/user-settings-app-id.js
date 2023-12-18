const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const router = express.Router()
const htmlTitle = 'Settings / App ID'

router.route('/')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            return res.redirect('/settings')
        }

        //
        const {rows} = await db.getClient(req.query.id)

        //
        if(rows.length == 0) {
            return res.send('app does not exist')
        }

        //
        const row = rows[0]

        //
        if(row.user_id != req.session.user.user_id) {
            return res.send('wrong user')
        }

        //
        renderHtml(req, res, row)
    })
    .post(async (req, res) => {

        //
        if(!req.session.user) {
            return res.send('please log in')
        }

        //
        const {rows} = await db.getClient(req.query.id)

        //
        if(rows.length == 0) {
            return res.send('app does not exist')
        }

        //
        const row = rows[0]

        //
        if(row.user_id != req.session.user.user_id) {
            return res.send('wrong user')
        }

        //
        const errors = myMisc.validateOauthClient(
            req.body.name,
            req.body.ruri
        )

        const updatedRow = {
            public_client_id: row.public_client_id,
            app_name: req.body.name,
            redirect_uri: req.body.ruri
        }

        if(errors.length > 0) {
            renderHtml(req, res, updatedRow, errors)
        }
        else {
            await db.updateClient(
                row.client_id,
                req.body.name,
                req.body.ruri)
            
            renderHtml(
                req,
                res,
                updatedRow,
                [],
                'app info saved')
        }

    })

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
