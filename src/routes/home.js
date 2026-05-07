const express = require('express')
const db = require('../db')
const userSettings = require('../util/user-settings.js')
const config = require('../config')
const {sitePageValue} = require('../middleware/site-page-value.js')
const {sitePostSortValue} = require('../middleware/site-post-sort-value')
const {renderPaginate404} = require('../util/render')

const htmlTitle = config.siteName

//
const get = async (req, res) => {

    //
    const page = res.locals.page
    const sort = res.locals.sort
    const baseUrl = '/'

    //
    const postsPerPage = userSettings.getCurrPostsPerPage(req)
    const {rows:[{count:postsCount}]} = await db.getPostsCount()
    const numPages = Math.ceil(postsCount/postsPerPage)

    //
    if(numPages > 0 && page > numPages) {
        return renderPaginate404(req, res, page, numPages)
    }

    //
    const {rows} = await db.getPosts(
        userSettings.getCurrTimeZone(req),
        page,
        sort,
        postsPerPage,
        userSettings.getCurrDateFormat(req))

    return res.render('posts2', {
        html_title: htmlTitle,
        meta_desc: "This is an internet forum with posts and nested comments. " +
            "It supports subs/communities and hashtags for the posts.",
        user: req.session.user,
        posts: rows,
        page: page,
        base_url: baseUrl,
        post_layout: userSettings.getCurrPostLayout(req),
        sort: sort,
        posts_vertical_spacing: userSettings.getCurrPostsVerticalSpacing(req),
        num_pages: numPages
    })
}

//
const router = express.Router()
router.get('/', sitePageValue, sitePostSortValue, get)
module.exports = router
