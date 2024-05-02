
//
const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})

//
const get = async (req, res) => {

    //
    const castle = req.params[0]
    const {rows:[sub]} = await db.getSub(castle)

    //
    if(!sub) {
        return myMisc.renderNoSubMessage(req, res, castle)
    }

    //
    return res.render(
        'castle-about',
        {
            html_title: `About ${castle}`,
            user: req.session.user,
            desc: sub.sub_desc,
            lead_mod_user_id: sub.lead_mod,
            lead_mod_public_id: sub.lead_mod_public_id,
            lead_mod_username: sub.lead_mod_username,
            curr_castle: castle,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            main_class: 'main-text'
        }
    )
}

//
router.get('/', get)
module.exports = router
