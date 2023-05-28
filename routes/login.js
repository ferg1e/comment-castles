const express = require('express')
const argon2 = require('argon2')
const db = require('../db')
const myMisc = require('../misc.js')

const router = express.Router()
const htmlTitleLogin = 'Log In'

router.get(
    '/',
    (req, res) => {
        if(req.session.user) {
            res.render(
                'message',
                {
                    html_title: htmlTitleLogin,
                    message: "You're already logged in." +
                        " If you want to log in with a different account then please log out.",
                    user: req.session.user,
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
        else {
            res.render(
                'login',
                {
                    html_title: htmlTitleLogin,
                    errors:[],
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
    }
)

router.post(
    '/',
    async (req, res) => {
        let errors = []
        const {rows} = await db.getUserWithUsername(req.body.username)

        if(rows.length) {
            try {
                if(await argon2.verify(rows[0].password, req.body.password)) {
                    req.session.user = {
                        user_id: rows[0].user_id,
                        username: rows[0].username,
                        time_zone: rows[0].time_zone,
                        post_mode: rows[0].post_mode,
                        comment_reply_mode: rows[0].comment_reply_mode,
                        site_width: rows[0].site_width,
                        eyes: rows[0].eyes
                    }

                    //
                    const redirectUrl = (typeof req.query.rurl === 'undefined')
                        ? '/'
                        : req.query.rurl

                    return res.redirect(redirectUrl)
                }
                else {
                    errors.push('Invalid username and password')
                }
            }
            catch(err) {
                errors.push('Unknown error, please try it again')
            }
        }
        else {
            errors.push('Invalid username and password')
        }

        res.render(
            'login',
            {
                html_title: htmlTitleLogin,
                errors:errors,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    }
)

module.exports = router
