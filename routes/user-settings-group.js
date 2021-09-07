const express = require('express')
const myMisc = require('../misc.js')
const router = express.Router()
const htmlTitle = 'Settings / Group'

router.route('/')
    .get(async (req, res) => {

        //
        if(!req.session.user) {
            return res.redirect('/settings')
        }

        //
        res.render(
            'my-settings-group',
            {
                html_title: htmlTitle,
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })

module.exports = router
