const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')
const router = express.Router()
const htmlTitle = 'Settings / Group'

router.route('/')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            return res.redirect('/settings')
        }

        //
        const {rows:data1} = await db.getPrivateGroupWithName(req.query.name)

        //
        if(data1.length) {

            //
            const privateGroup = data1[0]

            if(privateGroup.created_by == req.session.user.user_id) {
                res.render(
                    'my-settings-group',
                    {
                        html_title: htmlTitle,
                        user: req.session.user,
                        max_width: myMisc.getCurrSiteMaxWidth(req),
                        errors: []
                    })
            }
            else {
                res.send('hello...')
            }
        }
        else {
            res.send('private group does not exist')
        }
    })
    .post(async (req, res) => {

        //
        if(req.session.user) {

            //
            const {rows:data1} = await db.getPrivateGroupWithName(req.query.name)

            //
            if(data1.length) {

                //
                const privateGroup = data1[0]

                if(privateGroup.created_by == req.session.user.user_id) {
                    res.render(
                        'my-settings-group',
                        {
                            html_title: htmlTitle,
                            user: req.session.user,
                            max_width: myMisc.getCurrSiteMaxWidth(req),
                            errors: []
                        })
                }
                else {
                    res.send('hello...')
                }
            }
            else {
                res.send('private group does not exist')
            }
        }
        else {
            res.send('please log in')
        }
    })

module.exports = router
