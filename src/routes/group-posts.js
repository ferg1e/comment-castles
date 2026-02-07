const express = require('express')
const {checkSub} = require('../middleware/check-sub.js')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {sitePageValue} = require('../middleware/site-page-value.js')

const router = express.Router({mergeParams: true})

//
const get = async (req, res) => {

    //
    const subSlug = res.locals.subSlug
    const sub = res.locals.sub
    const page = res.locals.page
    const sort = myMisc.getPostSort(req)

    // unknown sort
    if(typeof req.query.sort !== 'undefined' && sort === '') {
        return res.redirect(`/r/${subSlug}`)
    }

    //
    const postsPerPage = myMisc.getCurrPostsPerPage(req)
    const {rows:[{count:postsCount}]} = await db.getSubPostsCount(sub.sub_id)
    const numPages = Math.ceil(postsCount/postsPerPage)

    //
    if(numPages > 0 && page > numPages) {
        return res.status(404).render('http-error-404', {
            message: `There are only ${numPages} pages and ` +
                `you tried to access page ${page}. ` +
                `<a href="/r/${subSlug}">Return to page 1</a>.`
        })
    }

    //
    const {rows} = await db.getSubPosts(
        myMisc.getCurrTimeZone(req),
        page,
        subSlug,
        sort,
        postsPerPage,
        myMisc.getCurrDateFormat(req))

    return res.render('posts2', {
        html_title: subSlug,
        user: req.session.user,
        posts: rows,
        page: page,
        base_url: `/r/${subSlug}`,
        max_width: myMisc.getCurrSiteMaxWidth(req),
        post_layout: myMisc.getCurrPostLayout(req),
        lead_mod_user_id: sub.lead_mod,
        curr_castle: subSlug,
        sort: sort,
        posts_vertical_spacing: myMisc.getCurrPostsVerticalSpacing(req),
        num_pages: numPages
    })
}

//
router.get('/', checkSub, sitePageValue, get)
module.exports = router
