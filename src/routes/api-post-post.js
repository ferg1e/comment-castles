const db = require('../db')
const {isOauthUser} = require('../middleware/is-oauth-user')

//
const post = async (req, res) => {

    //
    const title = (typeof req.body.title === 'undefined') ? '' : req.body.title
    const text_content = (typeof req.body.text_content === 'undefined') ? '' : req.body.text_content
    const link = (typeof req.body.link === 'undefined') ? '' : req.body.link
    const sub = (typeof req.body.sub === 'undefined') ? '' : req.body.sub

    //
    const oauthUser = res.locals.oauthUser

    //
    const [errors, wsCompressedTitle, trimSub] = await db.validateNewPost(
        title,
        link,
        sub)

    //
    if(errors.length) {
        return res.status(400).json({
            errors: errors,
        })
    }

    //
    const newPost = await db.createPost(
        oauthUser.user_id,
        wsCompressedTitle,
        text_content,
        link,
        trimSub)

    //
    return res.json(newPost)
}

//
module.exports = [isOauthUser, post]
