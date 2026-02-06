const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const {sitePageValue} = require('../middleware/site-page-value.js')

const router = express.Router({mergeParams: true})

//
const get = async (req, res) => {
    const hashtag = req.params[0]
    const page = res.locals.page

    //
    const {rows:[dbHashtag]} = await db.getHashtag(hashtag)
    const sort = myMisc.getPostSort(req)
    let posts = []
    let numPages = 0

    //
    if(dbHashtag) {

        //
        const postsPerPage = myMisc.getCurrPostsPerPage(req)
        const {rows:[{count:postsCount}]} = await db.getHashtagPostsCount(dbHashtag.hashtag_id)
        numPages = Math.ceil(postsCount/postsPerPage)

        //
        const {rows} = await db.getHashtagPosts(
            myMisc.getCurrTimeZone(req),
            page,
            dbHashtag.hashtag_id,
            sort,
            postsPerPage,
            myMisc.getCurrDateFormat(req))

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
