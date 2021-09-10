const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')
const router = express.Router()
const htmlTitle = 'Settings / Groups'

router.route('/')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            return res.redirect('/settings')
        }

        //
        renderHtml(req, res, [])
    })
    .post(async (req, res) => {
        if(req.session.user) {

            //
            const errors = await db.validatePrivateGroup(req.body.group)

            //
            if(errors.length) {

                //
                renderHtml(req, res, errors)
            }
            else {
                await db.createPrivateGroup(
                    req.body.group,
                    req.session.user.user_id)

                //
                renderHtml(req, res, [{msg:"Private group successfully created"}])
            }
        }
        else {
            res.send(':)')
        }
    })

module.exports = router

//
async function renderHtml(req, res, errors) {
    const {rows:createdGroups} = await db.getUserCreatedPrivateGroups(req.session.user.user_id)

    //
    res.render(
        'my-settings-groups',
        {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            errors: errors,
            created_groups: createdGroups
        })
}
