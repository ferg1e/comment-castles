
//
const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router()
const htmlTitleNewPost = 'New Post'

//
const get = async (req, res) => {

    if(!req.session.user) {
        return res.render(
            'message',
            {
                html_title: htmlTitleNewPost,
                message: "Please <a href=\"/login\">log in</a> to create a post.",
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            }
        )
    }

    //
    const tags = (typeof req.query.group !== 'undefined')
        ? req.query.group
        : "";

    return res.render(
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
        }
    )
}

//
const post = async(req, res) => {

    if(!req.session.user) {
        return res.send('nope...')
    }

    //
    const [errors, wsCompressedTitle, trimTags] = await db.validateNewPost(
        req.body.title,
        req.body.link,
        req.body.tags,
        req.session.user.user_id)

    //
    if(errors.length) {
        return res.render(
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
            }
        )
    }

    //
    const newPost = await db.createPost(
        req.session.user.user_id,
        wsCompressedTitle,
        req.body.text_content,
        req.body.link,
        trimTags)

    return res.redirect('/p/' + newPost.post_id)
}

//
router.get('/', get)
router.post('/', post)
module.exports = router
