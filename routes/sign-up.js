const express = require('express')
const {body, validationResult} = require('express-validator')
const db = require('../db')
const myMisc = require('../misc.js')

const router = express.Router()
const regexUsername = /^[a-z0-9-]{4,16}$/i
const htmlTitleSignUp = 'Sign Up'

router.get(
    '/',
    (req, res) => {
        if(req.session.user) {
            res.render(
                'message',
                {
                    html_title: htmlTitleSignUp,
                    message: "You already signed up." +
                        " If you want to create another account then please <a href=\"/logout\">log out</a>.",
                    user: req.session.user,
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
        else {
            res.render(
                'sign-up',
                {
                    html_title: htmlTitleSignUp,
                    errors:[],
                    username: "",
                    is_login: "yes",
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
    }
)

router.post(
    '/',
    body('username', 'Username must be 4-16 characters (letters, numbers and dashes only)')
        .notEmpty().withMessage('Please fill in a username')
        .matches(regexUsername),
    body('password', 'Password must be 9-100 characters')
        .notEmpty().withMessage('Please fill in a password')
        .matches(/^.{9,100}$/),
    async (req, res) => {
        let errors = validationResult(req).array({onlyFirstError:true})

        if(errors.length) {
            res.render(
                'sign-up',
                {
                    html_title: htmlTitleSignUp,
                    errors:errors,
                    username: req.body.username,
                    is_login: req.body.is_login,
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
        else {
            const {username, password} = req.body

            try {
                var {rows} = await db.createUser(username, password)
            }
            catch(err) {
                let errorMessage = (err.constraint == 'username_unique_idx')
                    ? `"${username}" already taken`
                    : 'unknown error, please try again'
                
                //
                return res.render(
                    'sign-up',
                    {
                        html_title: htmlTitleSignUp,
                        errors:[{msg:errorMessage}],
                        username: req.body.username,
                        is_login: req.body.is_login,
                        max_width: myMisc.getCurrSiteMaxWidth(req)
                    })
            }

            if(req.body.is_login === 'yes') {
                req.session.user = {
                    user_id: rows[0].user_id,
                    public_id: rows[0].public_id,
                    username: rows[0].username,
                    time_zone: rows[0].time_zone,
                    post_mode: rows[0].post_mode,
                    post_layout: rows[0].post_layout,
                    one_bg_color: rows[0].one_bg_color,
                    two_bg_color: rows[0].two_bg_color,
                    main_text_color: rows[0].main_text_color,
                    posts_per_page: rows[0].posts_per_page,
                    posts_vertical_spacing: rows[0].posts_vertical_spacing,
                    comment_reply_mode: rows[0].comment_reply_mode,
                    site_width: rows[0].site_width,
                    eyes: rows[0].eyes
                }

                return res.redirect('/')
            }
            else {
                res.render(
                    'message',
                    {
                        html_title: htmlTitleSignUp,
                        message: "Sign up was successful, you can now <a href=\"/login\">log in</a>.",
                        user: req.session.user,
                        max_width: myMisc.getCurrSiteMaxWidth(req)
                    })
            }
        }
    }
)

module.exports = router
