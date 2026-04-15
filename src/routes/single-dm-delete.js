const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {isUser} = require('../middleware/is-user')
const {checkDm} = require('../middleware/check-dm')
const {isDmOwner} = require('../middleware/is-dm-owner')
const {renderMessage} = require('../util/render')

//
const htmlTitle = 'Delete DM'

//
const get = async (req, res) => {

    //
    const dm = res.locals.dm

    //
    return res.render('delete-dm', {
        html_title: htmlTitle,
        user: req.session.user,
        message: dm.dmessage,
        max_width: myMisc.getCurrSiteMaxWidth(req)
    })
}

//
const post = async (req, res) => {
            
    //
    const dm = res.locals.dm

    //
    await db.deleteDm(dm.dm_id)
    
    return renderMessage(req, res, htmlTitle,
        "The DM was successfully deleted.")
}

//
const router = express.Router({mergeParams: true})
router.get('/', isUser, checkDm, isDmOwner, get)
router.post('/', isUser, checkDm, isDmOwner, post)
module.exports = router
