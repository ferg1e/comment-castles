const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {isUser} = require('../middleware/is-user')
const {checkDm} = require('../middleware/check-dm')
const {isDmOwner} = require('../middleware/is-dm-owner')
const {processDm} = require('../util/validate')

//
const htmlTitle = 'Edit DM'

//
const get = async (req, res) => {
            
    //
    const dm = res.locals.dm

    //
    return res.render('edit-dm', {
        html_title: htmlTitle,
        user: req.session.user,
        errors: [],
        message: dm.dmessage,
        max_width: myMisc.getCurrSiteMaxWidth(req)
    })
}

//
const post = async (req, res) => {
        
    //
    const dm = res.locals.dm

    //
    const [compressedMessage, messageErrors] = processDm(req.body.message)

    //
    if(messageErrors.length > 0) {
        return res.render('edit-dm', {
            html_title: htmlTitle,
            user: req.session.user,
            errors: messageErrors,
            message: req.body.message,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        })
    }

    //
    await db.updateDm(
        dm.dm_id,
        compressedMessage)

    //redirect to DMs for this user pair
    const {rows:[toUser]} = await db.getUserWithUserId(dm.to_user_id)
    return res.redirect('/dms/' + toUser.public_id)
}

//
const router = express.Router({mergeParams: true})
router.get('/', isUser, checkDm, isDmOwner, get)
router.post('/', isUser, checkDm, isDmOwner, post)
module.exports = router
