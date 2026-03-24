const db = require('../db')
const myMisc = require('../util/misc.js')
const config = require('../config')
const {oauthAuthenticate} = require('../util/oauth-authenticate')

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
    let page = 1

    if(typeof req.query.p !== 'undefined') {
        page = parseInt(req.query.p)

        if(isNaN(page)) {
            page = 1
        }
    }

    //
    const oauthData = await oauthAuthenticate(req, res)

    //
    const sort = myMisc.getPostSort(req)
    const timeZone = oauthData ? oauthData.user.time_zone : config.defaultTimeZone

    //
    const {rows} = await db.getSubPosts(
        timeZone,
        page,
        urlSub,
        sort,
        config.defaultPostsPerPage,
        config.defaultDateFormat)

    //
    const rows2 = []

    for(const i in rows) {
        const v = rows[i]

        rows2.push({
            post_id: v.public_id,
            title: v.title,
            link: v.link,
            post_time: v.created_on_raw,
            author_username: v.username,
            author_user_id: v.user_public_id,
            num_comments: v.num_comments,
            sub: v.castle
        })
    }

    res.json(rows2)
}

//
module.exports = get
