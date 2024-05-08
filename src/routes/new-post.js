
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
    const castle = (typeof req.query.sub !== 'undefined')
        ? req.query.sub
        : "";

    //
    const {rows:[sub]} = await db.getSub(castle)

    //
    return res.render(
        'new-post2',
        {
            html_title: htmlTitleNewPost,
            user: req.session.user,
            errors: [],
            title: "",
            link: "",
            textContent: "",
            castle: castle,
            curr_castle: sub ? castle : undefined,
            lead_mod_user_id: sub ? sub.lead_mod : undefined,
            submitLabel: 'Create Post',
            heading: 'New Post',
            is_castle: true,
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
    const [errors, wsCompressedTitle, trimCastle] = await db.validateNewPost(
        req.body.title,
        req.body.link,
        req.body.castle)

    //
    if(errors.length) {

        //
        const {rows:[sub]} = await db.getSub(trimCastle)

        //
        return res.render(
            'new-post2',
            {
                html_title: htmlTitleNewPost,
                user: req.session.user,
                errors: errors,
                title: req.body.title,
                link: req.body.link,
                textContent: req.body.text_content,
                castle: req.body.castle,
                curr_castle: sub ? trimCastle : undefined,
                lead_mod_user_id: sub ? sub.lead_mod : undefined,
                submitLabel: 'Create Post',
                heading: 'New Post',
                is_castle: true,
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
        trimCastle)

    return res.redirect('/p/' + newPost.post_id)
}

//
router.get('/', get)
router.post('/', post)
module.exports = router
