const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const pug = require('pug')

//
const router = express.Router()

//
const postComment = async (req, res) => {

    //
    if(!req.session.user) {
        return res.json(0)
    }

    //
    const {rows:[comment]} = await db.getCommentWithPublic(req.body.commentid)

    if(!comment) {
        return res.json(0)
    }

    //
    const [compressedComment, errors] = myMisc.processComment(req.body.text_content)

    if(errors.length > 0) {
        return res.json(0)
    }

    //
    const {rows:[newComment]} = await db.createCommentComment(
        comment.post_id,
        req.session.user.user_id,
        compressedComment,
        comment.path,
        myMisc.getCurrTimeZone(req),
        myMisc.getCurrDateFormat(req))

    //TODO: make this a postgres trigger
    await db.incPostNumComments(comment.post_id)

    //
    newComment.by = req.session.user.username

    //
    const sPublicId = req.session.user.public_id

    // this user public_id may not be set on the session if
    // they've been logged in for a long time, so get it from the db
    // if it's not there
    if(typeof sPublicId == 'undefined') {
        const {rows:[xRow]} = await db.getUserWithUserId(req.session.user.user_id)
        newComment.user_public_id = xRow.public_id
    }
    else {
        newComment.user_public_id = sPublicId
    }

    //
    const bbCodesOnly = pug.compileFile('src/views/bbCodesOnly.pug')
    newComment.text_content = bbCodesOnly({text: newComment.text_content})

    //
    res.json(newComment)
}

//
router.post('/comment', postComment)
module.exports = router
