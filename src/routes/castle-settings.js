
//
const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})

//
const get = async (req, res) => {

    //
    if(!req.session.user) {
        return res.send('nope')
    }

    //
    const castle = req.params[0]
    const {rows:[sub]} = await db.getSub(castle)

    //
    if(!sub) {
        return myMisc.renderNoSubMessage(req, res, castle)
    }

    //
    if(req.session.user.user_id != sub.lead_mod) {
        return res.send('wrong user')
    }

    //
    return res.render(
        'castle-settings',
        {
            html_title: `${castle} Settings`,
            user: req.session.user,
            errors: [],
            desc: sub.sub_desc,
            lead_mod_user_id: sub.lead_mod,
            curr_castle: castle,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        }
    )
}

//
const post = async(req, res) => {

    //
    if(!req.session.user) {
        return res.send('nope')
    }

    //
    const castle = req.params[0]
    const {rows:[sub]} = await db.getSub(castle)

    //
    if(!sub) {
        return myMisc.renderNoSubMessage(req, res, castle)
    }

    //
    if(req.session.user.user_id != sub.lead_mod) {
        return res.send('wrong user')
    }

    //
    db.updateSub(sub.sub_id, req.body.desc)

    //
    return res.render(
        'castle-settings',
        {
            html_title: `${castle} Settings`,
            user: req.session.user,
            success: 'Settings successfully saved.',
            errors: [],
            desc: req.body.desc,
            lead_mod_user_id: sub.lead_mod,
            curr_castle: castle,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        }
    )
}

//
router.get('/', get)
router.post('/', post)
module.exports = router
