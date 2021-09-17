const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')

const router = express.Router({mergeParams: true})

//single post
router.route('/')
    .get(async (req, res) => {
        const postPublicId = req.params[0]
        const finalUserId = req.session.user ? req.session.user.user_id : -1
        const filterUserId = await db.getCurrEyesId(req)

        const {rows} = await db.getPostWithPublic2(
            postPublicId,
            myMisc.getCurrTimeZone(req),
            finalUserId,
            filterUserId)

        if(rows.length) {

            //
            const isAllowed = await db.isAllowedToViewPost(
                rows[0].private_group_ids,
                req.session.user.user_id)

            if(!isAllowed) {
                return res.render(
                    'message',
                    {
                        html_title: 'Post #' + rows[0].public_id,
                        message: "This post is from a private group and you do not have access.",
                        user: req.session.user,
                        max_width: myMisc.getCurrSiteMaxWidth(req)
                    })
            }

            //
            const isDiscoverMode = myMisc.isDiscover(req)

            const{rows:comments} = await db.getPostComments(
                rows[0].post_id,
                myMisc.getCurrTimeZone(req),
                finalUserId,
                isDiscoverMode,
                filterUserId)

            //
            const htmlTitle = rows[0].is_visible
                ? rows[0].title
                : 'Post #' + rows[0].public_id;

            //
            res.render(
                'single-post',
                {
                    html_title: htmlTitle,
                    user: req.session.user,
                    post: rows[0],
                    comments: comments,
                    errors: [],
                    is_discover_mode: isDiscoverMode,
                    comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                }
            )
        }
        else {
            res.send('not found')
        }
    })
    .post(
        async (req, res) => {

            if(req.session.user) {
                const postPublicId = req.params[0]
                const finalUserId = req.session.user ? req.session.user.user_id : -1
                const filterUserId = await db.getCurrEyesId(req)

                const {rows} = await db.getPostWithPublic2(
                    postPublicId,
                    myMisc.getCurrTimeZone(req),
                    finalUserId,
                    filterUserId)

                if(rows.length) {

                    //
                    const isAllowed = await db.isAllowedToViewPost(
                        rows[0].private_group_ids,
                        req.session.user.user_id)

                    if(!isAllowed) {
                        return res.render(
                            'message',
                            {
                                html_title: 'Post #' + rows[0].public_id,
                                message: "This post is from a private group and you do not have access.",
                                user: req.session.user,
                                max_width: myMisc.getCurrSiteMaxWidth(req)
                            })
                    }

                    let [compressedComment, errors] = myMisc.processComment(req.body.text_content)

                    //
                    if(errors.length) {

                        //
                        const isDiscoverMode = myMisc.isDiscover(req)

                        const{rows:comments} = await db.getPostComments(
                            rows[0].post_id,
                            myMisc.getCurrTimeZone(req),
                            finalUserId,
                            isDiscoverMode,
                            filterUserId)

                        //
                        const htmlTitle = rows[0].is_visible
                            ? rows[0].title
                            : 'Post #' + rows[0].public_id;

                        //
                        res.render(
                            'single-post',
                            {
                                html_title: htmlTitle,
                                user: req.session.user,
                                post: rows[0],
                                comments: comments,
                                errors: errors,
                                is_discover_mode: isDiscoverMode,
                                comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
                                max_width: myMisc.getCurrSiteMaxWidth(req)
                            }
                        )
                    }
                    else {

                        //
                        const {rows:data1} = await db.createPostComment(
                            rows[0].post_id,
                            req.session.user.user_id,
                            compressedComment)

                        //
                        await db.incPostNumComments(rows[0].post_id)
                        return res.redirect(`/p/${postPublicId}#${data1[0].public_id}`)
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
