//
const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router()
const htmlTitle = 'Settings / Password'

//
const get = async (req, res) => {

    //
    if(!req.session.user) {
        return res.redirect('/settings')
    }

    //
    res.render(
        'my-settings-password',
        {
            html_title: htmlTitle,
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req),
            errors: [],
        })
}

//
router.get('/', get)
//router.post('/', post)
module.exports = router
