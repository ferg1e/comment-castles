const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})
const htmlTitleEditComment = 'Edit Comment'

router.route('/')
    .get(async (req, res) => {
        if(req.session.user) {

            //
            const commentPublicId = req.params[0]
            const {rows} = await db.getCommentWithPublic(commentPublicId)

            //
            if(!rows.length) {
                return res.send('unknown comment...')
            }

            //
            if(rows[0].user_id != req.session.user.user_id) {
                return res.send('wrong user...')
            }

            //
            res.render(
                'edit-comment',
                {
                    html_title: htmlTitleEditComment,
                    user: req.session.user,
                    errors: [],
                    textContent: rows[0].text_content,
                    lead_mod_user_id: rows[0].lead_mod,
                    curr_castle: rows[0].castle,
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
        else {
            res.send('sorry...')
        }
    })
    .post(async (req, res) => {
            if(req.session.user) {

                //
                const commentPublicId = req.params[0]
                const {rows} = await db.getCommentWithPublic(commentPublicId)

                //
                if(!rows.length) {
                    return res.send('unknown comment...')
                }

                //
                if(rows[0].user_id != req.session.user.user_id) {
                    return res.send('wrong user...')
                }

                //
                let [compressedComment, errors] = myMisc.processComment(req.body.text_content)

                //
                if(errors.length) {
                    res.render(
                        'edit-comment',
                        {
                            html_title: htmlTitleEditComment,
                            user: req.session.user,
                            errors: errors,
                            textContent: "",
                            lead_mod_user_id: rows[0].lead_mod,
                            curr_castle: rows[0].castle,
                            max_width: myMisc.getCurrSiteMaxWidth(req)
                        })
                }
                else {
                    await db.updateComment(
                        rows[0].comment_id,
                        compressedComment)
                    
                    //
                    return res.redirect('/c/' + commentPublicId)
                }
            }
            else {
                res.send('nope...')
            }
        }
    )

module.exports = router
