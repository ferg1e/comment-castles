const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {isUser} = require('../middleware/is-user.js')
const {checkComment} = require('../middleware/check-comment.js')

const htmlTitle = 'Edit Comment'

//
const get = async (req, res) => {
    
    //
    const comment = res.locals.comment

    //
    if(comment.user_id != req.session.user.user_id) {
        return res.send('wrong user...')
    }

    //
    return res.render('edit-comment', {
        html_title: htmlTitle,
        user: req.session.user,
        errors: [],
        textContent: comment.text_content,
        lead_mod_user_id: comment.lead_mod,
        curr_castle: comment.castle,
        max_width: myMisc.getCurrSiteMaxWidth(req)
    })
}

//
const post = async (req, res) => {

    //
    const comment = res.locals.comment
    const commentPublicId = res.locals.commentPublicId

    //
    if(comment.user_id != req.session.user.user_id) {
        return res.send('wrong user...')
    }

    //
    let [compressedComment, errors] = myMisc.processComment(req.body.text_content)

    //
    if(errors.length) {
        return res.render('edit-comment', {
            html_title: htmlTitle,
            user: req.session.user,
            errors: errors,
            textContent: "",
            lead_mod_user_id: comment.lead_mod,
            curr_castle: comment.castle,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
    }

    //
    await db.updateComment(
        comment.comment_id,
        compressedComment)
    
    //
    return res.redirect('/c/' + commentPublicId)
}

//
const router = express.Router({mergeParams: true})
router.get('/', isUser, checkComment, get)
router.post('/', isUser, checkComment, post)
module.exports = router
