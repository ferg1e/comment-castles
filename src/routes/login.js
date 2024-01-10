const express = require('express')
const argon2 = require('argon2')
const db = require('../db')
const myMisc = require('../util/misc.js')

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
                        public_id: rows[0].public_id,
                        username: rows[0].username,
                        time_zone: rows[0].time_zone,
                        post_mode: rows[0].post_mode,
                        post_layout: rows[0].post_layout,
                        one_bg_color: rows[0].one_bg_color,
                        two_bg_color: rows[0].two_bg_color,
                        main_text_color: rows[0].main_text_color,
                        post_link_color: rows[0].post_link_color,
                        post_link_visited_color: rows[0].post_link_visited_color,
                        group_bg_color: rows[0].group_bg_color,
                        group_text_color: rows[0].group_text_color,
                        hidden_color: rows[0].hidden_color,
                        domain_name_color: rows[0].domain_name_color,
                        unfollow_bg_color: rows[0].unfollow_bg_color,
                        unfollow_line_color: rows[0].unfollow_line_color,
                        unfollow_text_color: rows[0].unfollow_text_color,
                        follow_bg_color: rows[0].follow_bg_color,
                        follow_line_color: rows[0].follow_line_color,
                        follow_text_color: rows[0].follow_text_color,
                        posts_per_page: rows[0].posts_per_page,
                        posts_vertical_spacing: rows[0].posts_vertical_spacing,
                        comment_reply_mode: rows[0].comment_reply_mode,
                        site_width: rows[0].site_width,
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
