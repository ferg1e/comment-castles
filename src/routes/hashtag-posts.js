const express = require('express')
const db = require('../db')
const userSettings = require('../util/user-settings.js')
const {sitePageValue} = require('../middleware/site-page-value.js')
const {sitePostSortValue} = require('../middleware/site-post-sort-value')
const {renderPaginate404} = require('../util/render')

//
const get = async (req, res) => {

    //
    const hashtag = req.params[0]
    const page = res.locals.page
    const sort = res.locals.sort

    //
    const {rows:[dbHashtag]} = await db.getHashtag(hashtag)
    let posts = []
    let numPages = 0

    //
    if(dbHashtag) {

        //
        const postsPerPage = userSettings.getCurrPostsPerPage(req)
        const {rows:[{count:postsCount}]} = await db.getHashtagPostsCount(dbHashtag.hashtag_id)
        numPages = Math.ceil(postsCount/postsPerPage)

        //
        if(numPages > 0 && page > numPages) {
            return renderPaginate404(req, res, page, numPages)
        }

        //
        const {rows} = await db.getHashtagPosts(
            userSettings.getCurrTimeZone(req),
            page,
            dbHashtag.hashtag_id,
            sort,
            postsPerPage,
            userSettings.getCurrDateFormat(req))

        posts = rows
    }

    //
    return res.render('posts2', {
        html_title: `#${hashtag}`,
        page_title: `#${hashtag}`,
        user: req.session.user,
        posts: posts,
        page: page,
        base_url: `/t/${hashtag}`,
        post_layout: userSettings.getCurrPostLayout(req),
        sort: sort,
        posts_vertical_spacing: userSettings.getCurrPostsVerticalSpacing(req),
        num_pages: numPages
    })
}

//
const router = express.Router({mergeParams: true})
router.get('/', sitePageValue, sitePostSortValue, get)
module.exports = router
