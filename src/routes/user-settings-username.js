const express = require('express')
const argon2 = require('argon2')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router()
const regexUsername = /^[a-z0-9-]{4,16}$/i
const htmlTitleSettingsUsername = 'Settings / Username'

router.route('/')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            return res.redirect('/settings')
        }

        //
        res.render(
            'my-settings-username',
            {
                html_title: htmlTitleSettingsUsername,
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                errors: [],
                username: req.session.user.username
            })
    })
    .post(async (req, res) => {

        if(req.session.user) {

            //
            const errors = []
            const username = req.body.username

            //
            if(!username.match(regexUsername)) {
                errors.push({msg: "Username must be 4-16 characters(letters, numbers and dashes only)"})
            }
            else {
                const {rows} = await db.getUserWithUsername(username)

                if(rows.length && rows[0].user_id != req.session.user.user_id) {
                    errors.push({msg: "username already taken"})
                }
            }

            //
            const {rows:rows2} = await db.getUserWithUserId(req.session.user.user_id)
            const isCorrectPassword = await argon2.verify(rows2[0].password, req.body.password)

            if(!isCorrectPassword) {
                errors.push({msg: "incorrect existing password"})
            }

            //
            if(errors.length) {
                res.render(
                    'my-settings-username',
                    {
                        html_title: htmlTitleSettingsUsername,
                        user: req.session.user,
                        max_width: myMisc.getCurrSiteMaxWidth(req),
                        errors: errors,
                        username: username
                    })
            }
            else {

                //
                await db.updateUserUsername(req.session.user.user_id, username)
                req.session.user.username = username

                //
                res.render(
                    'my-settings-username',
                    {
                        html_title: htmlTitleSettingsUsername,
                        user: req.session.user,
                        max_width: myMisc.getCurrSiteMaxWidth(req),
                        errors: [],
                        success: 'Username successfully saved',
                        username: username
                    })
            }
        }
        else {
            res.send('nope...')
        }
    })

module.exports = router
