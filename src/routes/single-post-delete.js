const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})
const htmlTitle = 'Delete Post'

router.route('/')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            return res.send('sorry...')
        }

        //
        const postPublicId = req.params[0]
        const {rows} = await db.getPostWithPublic(postPublicId)

        //
        if(!rows.length) {
            return res.send('unknown post...')
        }

        //
        if(rows[0].user_id != req.session.user.user_id) {
            return res.send('wrong user...')
        }

        //
        res.render(
            'delete-post',
            {
                html_title: htmlTitle,
                user: req.session.user,
                title: rows[0].title,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })
    .post(async (req, res) => {
            
        //
        if(!req.session.user) {
            return res.send('nope...')
        }

        //
        const postPublicId = req.params[0]
        const {rows} = await db.getPostWithPublic(postPublicId)

        //
        if(!rows.length) {
            return res.send('unknown post...')
        }

        //
        if(rows[0].user_id != req.session.user.user_id) {
            return res.send('wrong user...')
        }

        await db.deleteWholePost(rows[0].post_id)
        
        return res.render(
            'message',
            {
                html_title: htmlTitle,
                message: "The post and all of its comments (if any) were successfully deleted.",
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })

module.exports = router
