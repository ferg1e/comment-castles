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
        res.render(
            'my-settings-groups',
            {
                html_title: htmlTitle,
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                errors: []
            })
    })
    .post(async (req, res) => {
        if(req.session.user) {

            //
            const errors = await db.validatePrivateGroup(req.body.group)

            //
            if(errors.length) {
                res.render(
                    'my-settings-groups',
                    {
                        html_title: htmlTitle,
                        user: req.session.user,
                        max_width: myMisc.getCurrSiteMaxWidth(req),
                        errors: errors
                    })
            }
            else {
                await db.createPrivateGroup(
                    req.body.group,
                    req.session.user.user_id)

                //
                res.send('created..')
            }
        }
        else {
            res.send(':)')
        }
    })

module.exports = router
