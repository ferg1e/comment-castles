const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')
const router = express.Router()
const htmlTitle = 'Settings / App IDs'

router.route('/')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            return res.redirect('/settings')
        }

        //
        renderHtml(req, res, [])
    })

module.exports = router

//
async function renderHtml(req, res, errors, success) {
    //const {rows:createdGroups} = await db.getUserCreatedPrivateGroups(req.session.user.user_id)

    //
    res.render(
        'my-settings-app-ids',
        {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            errors: errors,
            success: success,
        })
}
