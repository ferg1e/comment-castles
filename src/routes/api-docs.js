const express = require('express')
const myMisc = require('../util/misc.js')

//
const get = (req, res) => {
    return res.render('api', {
        html_title: 'API',
        user: req.session.user,
        max_width: myMisc.getCurrSiteMaxWidth(req),
        main_class: 'main-text'
    })
}

//
const router = express.Router()
router.get('/', get)
module.exports = router
