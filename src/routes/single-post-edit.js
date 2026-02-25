const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {isUser} = require('../middleware/is-user.js')
const {checkPost} = require('../middleware/check-post.js')

const router = express.Router({mergeParams: true})
const htmlTitle = 'Edit Post'

//
const get = async (req, res) => {

    //
    const post = res.locals.post

    //
    if(post.user_id != req.session.user.user_id) {
        return res.send('wrong user...')
    }

    //
    return res.render(
        'new-post2',
        {
            html_title: htmlTitle,
            user: req.session.user,
            errors: [],
            title: post.title,
            link: post.link === null ? '' : post.link,
            textContent: post.text_content,
            castle: post.castle,
            lead_mod_user_id: post.lead_mod,
            curr_castle: post.castle,
            submitLabel: 'Edit Post',
            heading: 'Edit Post',
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
    
}

//
const post = async (req, res) => {
        
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
                html_title: htmlTitle,
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
}

//
router.get('/', isUser, checkPost, get)
router.post('/', isUser, post)
module.exports = router
