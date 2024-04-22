const express = require('express')
const {body, validationResult} = require('express-validator')
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
                    tags: rows[0].tags.join(', '),
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
        const [errors, wsCompressedTitle, trimTags] = await db.validateEditPost(
            req.body.title,
            req.body.link,
            req.body.tags)

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
                    tags: req.body.tags,
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
            req.body.link,
            trimTags)

        //
        return res.redirect('/p/' + postPublicId)
    })

module.exports = router
