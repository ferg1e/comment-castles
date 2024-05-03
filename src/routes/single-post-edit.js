const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})
const htmlTitleEditPost = 'Edit Post'

router.route('/')
    .get(async (req, res) => {
        if(req.session.user) {

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
                'new-post2',
                {
                    html_title: htmlTitleEditPost,
                    user: req.session.user,
                    errors: [],
                    title: rows[0].title,
                    link: rows[0].link === null ? '' : rows[0].link,
                    textContent: rows[0].text_content,
                    castle: rows[0].castle,
                    lead_mod_user_id: rows[0].lead_mod,
                    curr_castle: rows[0].castle,
                    submitLabel: 'Edit Post',
                    heading: 'Edit Post',
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
        else {
            res.send('sorry...')
        }
    })
    .post(async (req, res) => {
        
        //
        if(!req.session.user) {
            return res.send('nope...')
        }

        //
        const postPublicId = req.params[0]
        const {rows:[row]} = await db.getPostWithPublic(postPublicId)

        //
        if(!row) {
            return res.send('unknown post...')
        }

        //
        if(row.user_id != req.session.user.user_id) {
            return res.send('wrong user...')
        }

        //
        const [errors, wsCompressedTitle] = await db.validateEditPost(
            req.body.title,
            req.body.link)

        //
        if(errors.length) {
            return res.render(
                'new-post2',
                {
                    html_title: htmlTitleEditPost,
                    user: req.session.user,
                    errors: errors,
                    title: req.body.title,
                    link: req.body.link,
                    textContent: req.body.text_content,
                    lead_mod_user_id: row.lead_mod,
                    curr_castle: row.castle,
                    submitLabel: 'Edit Post',
                    heading: 'Edit Post',
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                }
            )
        }

        //
        await db.updatePost(
            row.post_id,
            wsCompressedTitle,
            req.body.text_content,
            req.body.link)

        //
        return res.redirect('/p/' + postPublicId)
    })

module.exports = router
