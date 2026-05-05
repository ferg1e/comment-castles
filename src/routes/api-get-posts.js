const db = require('../db')
const config = require('../config')
const {apiPageValue} = require('../middleware/api-page-value.js')
const {getPostSort} = require('../util/validate')

//
const get = async (req, res) => {

    //
    const page = res.locals.page

    //
    const postsPerPage = config.defaultPostsPerPage
    const {rows:[{count:postsCount}]} = await db.getPostsCount()
    const numPages = Math.ceil(postsCount/postsPerPage)

    //
    if(numPages > 0 && page > numPages) {
        return res.status(404).json({
            errors: ['page (p) value higher than number of pages'],
        })
    }

    //
    const sort = getPostSort(req)

    const {rows:posts} = await db.getPosts(
        config.defaultTimeZone,
        page,
        sort,
        postsPerPage,
        config.defaultDateFormat)

    //
    const reKeyedPosts = posts.map(v => ({
        post_id: v.public_id,
        title: v.title,
        link: v.link,
        post_time: v.created_on_raw,
        author_username: v.username,
        author_user_id: v.user_public_id,
        num_comments: v.num_comments,
        sub: v.castle
    }))

    return res.json(reKeyedPosts)
}

//
module.exports = [apiPageValue, get]
