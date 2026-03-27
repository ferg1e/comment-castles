const db = require('../db')
const config = require('../config')
const {oauthAuthenticate} = require('../util/oauth-authenticate')

//
const get = async (req, res) => {

    //
    if(typeof req.query.postid === 'undefined') {
        return res.status(400).json({
            errors: ['no postid in URL'],
        })
    }

    //
    const oauthData = await oauthAuthenticate(req, res)

    //
    const postPublicId = req.query.postid
    const timeZone = oauthData ? oauthData.user.time_zone : config.defaultTimeZone

    //
    const {rows:[post]} = await db.getPostWithPublic2(
        postPublicId,
        timeZone,
        config.defaultDateFormat)

    //
    if(!post) {
        return res.status(404).json({
            errors: ["no post with that postid"],
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
    const{rows:comments} = await db.getPostComments(
        post.post_id,
        timeZone,
        page,
        config.defaultDateFormat)

    //
    let comments2 = []

    for(const i in comments) {
        const c = comments[i]
        const dotCount = (c.path.match(/\./g)||[]).length

        comments2.push({
            comment_text: c.text_content,
            indent_level: dotCount - 1,
            author_username: c.username,
            author_user_id: c.user_public_id,
            comment_time: c.created_on_raw,
            comment_id: c.public_id
        })
    }
    
    let r = {
        title: post.title,
        link: post.link,
        post_text: post.text_content,
        post_time: post.created_on_raw,
        author_username: post.username,
        author_user_id: post.user_public_id,
        comments: comments2,
        sub: post.castle
    }

    res.json(r)
}

//
module.exports = get
