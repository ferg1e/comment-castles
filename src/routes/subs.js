const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')
const {sitePageValue} = require('../middleware/site-page-value.js')

const htmlTitle = 'Subs List'

//
const get = async (req, res) => {

    //
    const {rows:[{count:subsCount}]} = await db.getAllSubsCount()
    const numPages = Math.ceil(subsCount/config.subsPerPage)

    //
    const page = res.locals.page

    //
    const {rows:subs} = await db.getAllSubs(page)

    return res.render('subs', {
        html_title: htmlTitle,
        user: req.session.user,
        max_width: myMisc.getCurrSiteMaxWidth(req),
        subs: subs,
        page: page,
        num_pages: numPages,
        main_class: 'main-text'
    })
}

//
const router = express.Router()
router.get('/', sitePageValue, get)
module.exports = router
