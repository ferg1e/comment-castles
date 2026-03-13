const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')

const htmlTitle = 'Subs List'

//
const get = async (req, res) => {

    //
    const {rows:[{count:subsCount}]} = await db.getAllSubsCount()
    const numPages = Math.ceil(subsCount/config.subsPerPage)

    //
    let page = 1

    if(typeof req.query.p !== 'undefined') {
        page = parseInt(req.query.p)

        if(isNaN(page)) {
            return res.redirect('/subs')
        }
    }

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
router.get('/', get)
module.exports = router
