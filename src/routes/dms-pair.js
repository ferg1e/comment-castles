
//
const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})
const htmlTitle = 'Direct Messages'

//
const get = async (req, res) => {

    //
    if(!req.session.user) {
        return myMisc.renderMessage(req, res, htmlTitle,
            "<a href=\"/login\">Log in</a> to view your direct messages.")
    }

    //
    const userPublicId = req.params[0]
    const {rows:[dbUser]} = await db.getUserWithPublicId(userPublicId)

    //
    if(!dbUser) {
        return res.send('invalid id')
    }

    //
    const {rows:dms} = await db.getPairDms(req.session.user.user_id, dbUser.user_id)

    //
    return res.render(
        'dms-pair',
        {
            html_title: '???',
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            dms: dms,
        }
    )
}

//
const post = async(req, res) => {

    return res.send('post')

}

//
router.get('/', get)
router.post('/', post)
module.exports = router
