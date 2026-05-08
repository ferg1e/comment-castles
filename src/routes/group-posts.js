const express = require('express')
const {checkSub} = require('../middleware/check-sub.js')
const db = require('../db')
const userSettings = require('../util/user-settings.js')
const {sitePageValue} = require('../middleware/site-page-value.js')
const {sitePostSortValue} = require('../middleware/site-post-sort-value')
const {renderPaginate404} = require('../util/render')

//
const get = async (req, res) => {

    //
    const subSlug = res.locals.subSlug
    const sub = res.locals.sub
    const page = res.locals.page
    const sort = res.locals.sort

    //
    const postsPerPage = userSettings.getCurrPostsPerPage(req)
    const {rows:[{count:postsCount}]} = await db.getSubPostsCount(sub.sub_id)
    const numPages = Math.ceil(postsCount/postsPerPage)

    //
    if(numPages > 0 && page > numPages) {
        return renderPaginate404(req, res, page, numPages)
    }

    //
    const {rows} = await db.getSubPosts(
        userSettings.getCurrTimeZone(req),
        page,
        subSlug,
        sort,
        postsPerPage,
        userSettings.getCurrDateFormat(req))

    return res.render('posts2', {
        html_title: subSlug,
        posts: rows,
        page: page,
        base_url: `/r/${subSlug}`,
        post_layout: userSettings.getCurrPostLayout(req),
        lead_mod_user_id: sub.lead_mod,
        curr_castle: subSlug,
        sort: sort,
        posts_vertical_spacing: userSettings.getCurrPostsVerticalSpacing(req),
        num_pages: numPages
    })
}

//
const router = express.Router({mergeParams: true})
router.get('/', checkSub, sitePageValue, sitePostSortValue, get)
module.exports = router
