const config = require('../config')
const express = require('express')
const {body, validationResult} = require('express-validator')
const db = require('../db')
const myMisc = require('../misc.js')

const router = express.Router()
const htmlTitleNewPost = 'New Post'

router.route('/')
    .get(async (req, res) => {
        if(req.session.user) {

            //
            const tags = (typeof req.query.group !== 'undefined')
                ? req.query.group
                : "";

            //
            res.render(
                'new-post2',
                {
                    html_title: htmlTitleNewPost,
                    user: req.session.user,
                    errors: [],
                    title: "",
                    link: "",
                    textContent: "",
                    tags: tags,
                    submitLabel: 'Create Post',
                    heading: 'New Post',
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
        else {
            res.render(
                'message',
                {
                    html_title: htmlTitleNewPost,
                    message: "Please <a href=\"/login\">log in</a> to create a post.",
                    user: req.session.user,
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
    })
    .post(async (req, res) => {
        if(req.session.user) {
            
            //
            const [errors, wsCompressedTitle, trimTags] = await db.validateNewPost(
                req.body.title,
                req.body.link,
                req.body.tags,
                req.session.user.user_id)

            //
            if(errors.length) {
                res.render(
                    'new-post2',
                    {
                        html_title: htmlTitleNewPost,
                        user: req.session.user,
                        errors: errors,
                        title: req.body.title,
                        link: req.body.link,
                        textContent: req.body.text_content,
                        tags: req.body.tags,
                        submitLabel: 'Create Post',
                        heading: 'New Post',
                        max_width: myMisc.getCurrSiteMaxWidth(req)
                    })
            }
            else {

                //
                let domainNameId = null

                if(req.body.link !== '') {
                    const domainName = myMisc.getDomainName(req.body.link)
                    domainNameId = await db.getDomainNameId(domainName)
                }

                //
                let vals = db.createPost(
                    req.session.user.user_id,
                    wsCompressedTitle,
                    req.body.text_content,
                    req.body.link,
                    domainNameId)

                const {rows} = await vals[0]

                //
                await db.createPostTags(trimTags, rows[0].post_id)
                
                //
                return res.redirect('/p/' + vals[1])
            }
        }
        else {
            res.send('nope...')
        }
    })

module.exports = router
