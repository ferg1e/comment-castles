const db = require('../db')
const config = require('../config')
const {apiPageValue} = require('../middleware/api-page-value.js')
const {validatePostSort} = require('../util/validate')

//
const get = async (req, res) => {

    //
    if(typeof req.query.sub === 'undefined') {
        return res.status(400).json({
            errors: ['no sub in URL'],
        })
    }

    //
    const urlSub = req.query.sub
    //possibly check for proper sub regex here
    const {rows:[dbSub]} = await db.getSub(urlSub)

    //
    if(!dbSub) {
        return res.status(404).json({
            errors: ["sub doesn't exist or invalid sub"],
        })
    }

    //
    const page = res.locals.page

    //
    const sort = validatePostSort(req)

    //
    const {rows} = await db.getSubPosts(
        config.defaultTimeZone,
        page,
        urlSub,
        sort,
        config.defaultPostsPerPage,
        config.defaultDateFormat)

    //
    const reKeyedPosts = rows.map(v => ({
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
