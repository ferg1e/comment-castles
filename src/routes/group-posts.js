const express = require('express')
const {checkSub} = require('../middleware/check-sub.js')
const db = require('../db')
const myMisc = require('../util/misc.js')

const router = express.Router({mergeParams: true})

//
const get = async (req, res) => {

    //
    const subSlug = res.locals.subSlug
    const sub = res.locals.sub

    //
    const postsPerPage = myMisc.getCurrPostsPerPage(req)
    const {rows:[{count:postsCount}]} = await db.getSubPostsCount(sub.sub_id)
    const numPages = Math.ceil(postsCount/postsPerPage)

    //
    let page = 1

    if(typeof req.query.p !== 'undefined') {
        page = parseInt(req.query.p)

        if(isNaN(page)) {
            return res.redirect(`/r/${subSlug}`)
        }
    }

    //
    const sort = myMisc.getPostSort(req)

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
router.get('/', checkSub, get)
module.exports = router
