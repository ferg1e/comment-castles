const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router()

router.route('/')
    .get(async (req, res) => {
        if(req.session.user) {

            //
            let page = 1

            if(typeof req.query.p !== 'undefined') {
                page = parseInt(req.query.p)

                if(isNaN(page)) {
                    return res.redirect('/inbox')
                }
            }

            //
            const{rows:comments} = await db.getInboxComments(
                myMisc.getCurrTimeZone(req),
                req.session.user.user_id,
                page,
                myMisc.getCurrDateFormat(req))

            //
            res.render(
                'inbox',
                {
                    html_title: 'Inbox',
                    user: req.session.user,
                    comments: comments,
                    page: page,
                    comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                }
            )
        }
        else {
            res.render(
                'message',
                {
                    html_title: 'Inbox',
                    message: "<a href=\"/login\">Log in</a> to view your inbox.",
                    user: req.session.user,
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
    })

module.exports = router
