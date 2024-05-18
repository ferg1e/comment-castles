
//
const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router()
const htmlTitle = 'Direct Messages'

//
const get = async (req, res) => {

    //
    if(!req.session.user) {
        return myMisc.renderMessage(req, res, htmlTitle,
            "<a href=\"/login\">Log in</a> to view your direct messages.")
    }

    //
    return res.render(
        'dms',
        {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        }
    )
}

//
const post = async(req, res) => {

    //
    if(!req.session.user) {
        return res.send('blocked')
    }

    //
    return res.send('post')
}

//
router.get('/', get)
router.post('/', post)
module.exports = router
