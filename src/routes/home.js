const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')
const {sitePageValue} = require('../middleware/site-page-value.js')
const {renderPaginate404} = require('../util/render')

const router = express.Router()
const htmlTitle = config.siteName

//
const get = async (req, res) => {

    //
    const page = res.locals.page
    const sort = myMisc.getPostSort(req)
    const baseUrl = '/'

    // unknown sort
    if(typeof req.query.sort !== 'undefined' && sort === '') {
        return res.redirect(baseUrl)
    }

    //
    const postsPerPage = myMisc.getCurrPostsPerPage(req)
    const {rows:[{count:postsCount}]} = await db.getPostsCount()
    const numPages = Math.ceil(postsCount/postsPerPage)

    //
    if(numPages > 0 && page > numPages) {
        return renderPaginate404(req, res, page, numPages)
    }

    //
    const {rows} = await db.getPosts(
        myMisc.getCurrTimeZone(req),
        page,
        sort,
        postsPerPage,
        myMisc.getCurrDateFormat(req))

    return res.render('posts2', {
        html_title: htmlTitle,
        meta_desc: "This is an internet forum with posts and nested comments. " +
            "It supports subs/communities and hashtags for the posts.",
        user: req.session.user,
        posts: rows,
        page: page,
        base_url: baseUrl,
        max_width: myMisc.getCurrSiteMaxWidth(req),
        post_layout: myMisc.getCurrPostLayout(req),
        sort: sort,
        posts_vertical_spacing: myMisc.getCurrPostsVerticalSpacing(req),
        num_pages: numPages
    })
}

//
router.get('/', sitePageValue, get)
module.exports = router
