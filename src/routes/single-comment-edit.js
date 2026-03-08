const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {isUser} = require('../middleware/is-user.js')

const router = express.Router({mergeParams: true})
const htmlTitle = 'Edit Comment'

//
const get = async (req, res) => {
    
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
            html_title: htmlTitle,
            user: req.session.user,
            errors: [],
            textContent: rows[0].text_content,
            lead_mod_user_id: rows[0].lead_mod,
            curr_castle: rows[0].castle,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
}

//
const post = async (req, res) => {

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
                html_title: htmlTitle,
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

//
router.get('/', isUser, get)
router.post('/', isUser, post)
module.exports = router
