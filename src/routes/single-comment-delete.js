const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})
const htmlTitle = 'Delete Comment'

router.route('/')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            return res.send('sorry...')
        }

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
            'delete-comment',
            {
                html_title: htmlTitle,
                user: req.session.user,
                text_content: rows[0].text_content,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })
    .post(async (req, res) => {
            
        //
        if(!req.session.user) {
            return res.send('nope...')
        }

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

        await db.deleteComment(rows[0].path)
        
        return res.render(
            'message',
            {
                html_title: htmlTitle,
                message: "The comment and all of its sub comments (if any) were successfully deleted.",
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })

module.exports = router
