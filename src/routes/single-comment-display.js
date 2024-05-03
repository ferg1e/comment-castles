const config = require('../config')
const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})
const htmlTitleComment = 'Comment #'

router.route('/')
    .get(async (req, res) => {
        const commentPublicId = req.params[0]

        const {rows} = await db.getCommentWithPublic2(
            commentPublicId,
            myMisc.getCurrTimeZone(req),
            myMisc.getCurrDateFormat(req))

        if(rows.length) {

            //
            let page = 1

            if(typeof req.query.p !== 'undefined') {
                page = parseInt(req.query.p)

                if(isNaN(page)) {
                    return res.redirect(`/c/${commentPublicId}`)
                }
            }

            //
            const{rows:comments} = await db.getCommentComments(
                rows[0].path,
                myMisc.getCurrTimeZone(req),
                page,
                myMisc.getCurrDateFormat(req))

            //
            const {rows:data2} = await db.getCommentNumComments(rows[0].path)

            const numComments = data2[0]['count']
            const totalPages = Math.ceil(numComments/config.commentsPerPage)

            //
            res.render(
                'single-comment',
                {
                    html_title: htmlTitleComment + commentPublicId,
                    user: req.session.user,
                    post_public_id: rows[0].post_public_id,
                    comment: rows[0],
                    comments: comments,
                    errors: [],
                    comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
                    max_width: myMisc.getCurrSiteMaxWidth(req),
                    page: page,
                    total_pages: totalPages,
                    lead_mod_user_id: rows[0].lead_mod,
                    curr_castle: rows[0].castle,
                }
            )
        }
        else {
            res.send('not found..')
        }
    })
    .post(
        async (req, res) => {
            if(req.session.user) {
                const commentPublicId = req.params[0]

                const {rows} = await db.getCommentWithPublic2(
                    commentPublicId,
                    myMisc.getCurrTimeZone(req),
                    myMisc.getCurrDateFormat(req))

                if(rows.length) {

                    //
                    let [compressedComment, errors] = myMisc.processComment(req.body.text_content)

                    if(errors.length) {

                        //
                        let page = 1

                        if(typeof req.query.p !== 'undefined') {
                            page = parseInt(req.query.p)

                            if(isNaN(page)) {
                                return res.redirect(`/c/${commentPublicId}`)
                            }
                        }

                        const{rows:comments} = await db.getCommentComments(
                            rows[0].path,
                            myMisc.getCurrTimeZone(req),
                            page,
                            myMisc.getCurrDateFormat(req))

                        //
                        const {rows:data2} = await db.getCommentNumComments(rows[0].path)

                        const numComments = data2[0]['count']
                        const totalPages = Math.ceil(numComments/config.commentsPerPage)

                        //
                        res.render(
                            'single-comment',
                            {
                                html_title: htmlTitleComment + commentPublicId,
                                user: req.session.user,
                                post_public_id: rows[0].post_public_id,
                                comment: rows[0],
                                comments: comments,
                                errors: errors,
                                comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
                                max_width: myMisc.getCurrSiteMaxWidth(req),
                                page,
                                total_pages: totalPages,
                                lead_mod_user_id: rows[0].lead_mod,
                                curr_castle: rows[0].castle,
                            }
                        )
                    }
                    else {

                        //
                        const {rows:data1} = await db.createCommentComment(
                            rows[0].post_id,
                            req.session.user.user_id,
                            compressedComment,
                            rows[0].path,
                            config.defaultTimeZone,
                            config.defaultDateFormat)

                        //
                        await db.incPostNumComments(rows[0].post_id)

                        //
                        const {rows:data2} = await db.getCommentNumComments(rows[0].path)

                        const numComments = data2[0]['count']
                        const pages = Math.ceil(numComments/config.commentsPerPage)
                        const redirectUrl = (pages > 1)
                            ? `/c/${commentPublicId}?p=${pages}#${data1[0].public_id}`
                            : `/c/${commentPublicId}#${data1[0].public_id}`

                        return res.redirect(redirectUrl)
                    }
                }
                else {
                    res.send('not found')
                }
            }
            else {
                res.send('nope...')
            }
    })

module.exports = router
