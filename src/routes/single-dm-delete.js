const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {isUser} = require('../middleware/is-user')
const {checkDm} = require('../middleware/check-dm')

//
const htmlTitle = 'Delete DM'

//
const get = async (req, res) => {

    //
    const dm = res.locals.dm

    //
    if(dm.from_user_id != req.session.user.user_id) {
        return res.send('wrong user...')
    }

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
    if(dm.from_user_id != req.session.user.user_id) {
        return res.send('wrong user...')
    }

    await db.deleteDm(dm.dm_id)
    
    return res.render('message', {
        html_title: htmlTitle,
        message: "The DM was successfully deleted.",
        user: req.session.user,
        max_width: myMisc.getCurrSiteMaxWidth(req)
    })
}

//
const router = express.Router({mergeParams: true})
router.get('/', isUser, checkDm, get)
router.post('/', isUser, checkDm, post)
module.exports = router
