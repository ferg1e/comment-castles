const config = require('../config')
const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})
const htmlTitleComment = 'Comment #'

router.route('/')
    .get(async (req, res) => {
        const commentPublicId = req.params[0]

        const {rows:[dbComment]} = await db.getCommentWithPublic2(
            commentPublicId,
            myMisc.getCurrTimeZone(req),
            myMisc.getCurrDateFormat(req))

        if(dbComment) {

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
                dbComment.path,
                myMisc.getCurrTimeZone(req),
                page,
                myMisc.getCurrDateFormat(req))

            //
            const {rows:[{count:numComments}]} = await db.getCommentNumComments(dbComment.path)
            const totalPages = Math.ceil(numComments/config.commentsPerPage)

            //
            res.render(
                'single-comment',
                {
                    html_title: htmlTitleComment + commentPublicId,
                    user: req.session.user,
                    post_public_id: dbComment.post_public_id,
                    comment: dbComment,
                    comments: comments,
                    errors: [],
                    comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
                    max_width: myMisc.getCurrSiteMaxWidth(req),
                    page: page,
                    total_pages: totalPages,
                    lead_mod_user_id: dbComment.lead_mod,
                    curr_castle: dbComment.castle,
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

                const {rows:[dbComment]} = await db.getCommentWithPublic2(
                    commentPublicId,
                    myMisc.getCurrTimeZone(req),
                    myMisc.getCurrDateFormat(req))

                if(dbComment) {

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
                            dbComment.path,
                            myMisc.getCurrTimeZone(req),
                            page,
                            myMisc.getCurrDateFormat(req))

                        //
                        const {rows:data2} = await db.getCommentNumComments(dbComment.path)

                        const numComments = data2[0]['count']
                        const totalPages = Math.ceil(numComments/config.commentsPerPage)

                        //
                        res.render(
                            'single-comment',
                            {
                                html_title: htmlTitleComment + commentPublicId,
                                user: req.session.user,
                                post_public_id: dbComment.post_public_id,
                                comment: dbComment,
                                comments: comments,
                                errors: errors,
                                comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
                                max_width: myMisc.getCurrSiteMaxWidth(req),
                                page,
                                total_pages: totalPages,
                                lead_mod_user_id: dbComment.lead_mod,
                                curr_castle: dbComment.castle,
                            }
                        )
                    }
                    else {

                        //
                        const {rows:data1} = await db.createCommentComment(
                            dbComment.post_id,
                            req.session.user.user_id,
                            compressedComment,
                            dbComment.path,
                            config.defaultTimeZone,
                            config.defaultDateFormat,
                            dbComment.user_id)

                        //
                        const {rows:data2} = await db.getCommentNumComments(dbComment.path)

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
