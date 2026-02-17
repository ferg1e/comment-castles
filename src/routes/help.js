const express = require('express')
const myMisc = require('../util/misc.js')
const config = require('../config')

//
const get = (req, res) => {
    return res.render('instruction-manual', {
        html_title: 'Help',
        user: req.session.user,
        max_width: myMisc.getCurrSiteMaxWidth(req),
        default_site_width: config.defaultSiteWidth,
        min_site_width: config.minSiteWidth,
        max_site_width: config.maxSiteWidth,
        default_ppp: config.defaultPostsPerPage,
        min_ppp: config.minPostsPerPage,
        max_ppp: config.maxPostsPerPage,
        default_pvs: config.defaultPostsVerticalSpacing,
        min_pvs: config.minPostsVerticalSpacing,
        max_pvs: config.maxPostsVerticalSpacing,
        main_class: 'main-text'
    })
}

//
const router = express.Router()
router.get('/', get)
module.exports = router
