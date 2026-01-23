const express = require('express')
const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')

const router = express.Router()
const htmlTitleHome = config.siteName

//
const getHome = async (req, res) => {

    //
    const page = myMisc.getPageNum(req)

    if(page === false) {
        return res.redirect('/')
    }

    //
    const postsPerPage = myMisc.getCurrPostsPerPage(req)
    const {rows:[{count:postsCount}]} = await db.getPostsCount()
    const numPages = Math.ceil(postsCount/postsPerPage)

    //
    if(numPages > 0 && page > numPages) {
        return res.status(404).render('error404', {
            message: `There are only ${numPages} pages and you tried to access page ${page} which doesn't exist. <a href="/">Go back to first page</a>.`
        })
    }

    //
    const sort = myMisc.getPostSort(req)

    //
    const {rows} = await db.getPosts(
        myMisc.getCurrTimeZone(req),
        page,
        sort,
        postsPerPage,
        myMisc.getCurrDateFormat(req))

    res.render('posts2', {
        html_title: htmlTitleHome,
        user: req.session.user,
        posts: rows,
        page: page,
        base_url: '/',
        max_width: myMisc.getCurrSiteMaxWidth(req),
        post_layout: myMisc.getCurrPostLayout(req),
        sort: sort,
        posts_vertical_spacing: myMisc.getCurrPostsVerticalSpacing(req),
        num_pages: numPages
    })
}

//
router.get('/', getHome)
module.exports = router
