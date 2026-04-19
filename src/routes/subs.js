const express = require('express')
const db = require('../db')
const config = require('../config')
const {sitePageValue} = require('../middleware/site-page-value.js')
const {renderPaginate404} = require('../util/render')

const htmlTitle = 'Subs List'

//
const get = async (req, res) => {

    //
    const {rows:[{count:subsCount}]} = await db.getAllSubsCount()
    const numPages = Math.ceil(subsCount/config.subsPerPage)

    //
    const page = res.locals.page

    //
    if(numPages > 0 && page > numPages) {
        return renderPaginate404(req, res, page, numPages)
    }

    //
    const {rows:subs} = await db.getAllSubs(page)

    return res.render('subs', {
        html_title: htmlTitle,
        user: req.session.user,
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
