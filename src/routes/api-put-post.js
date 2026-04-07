const db = require('../db')
const {isOauthUser} = require('../middleware/is-oauth-user')

//
const put = async (req, res) => {

    //
    const oauthUser = res.locals.oauthUser

    //
    if(typeof req.body.post_id === 'undefined') {
        return res.status(400).json({
            errors: ['no post_id in body'],
        })
    }

    //
    const postPublicId = req.body.post_id
    const {rows:[row]} = await db.getPostWithPublic(postPublicId)

    //
    if(!row) {
        return res.status(404).json({
            errors: ["no post with that postid"],
        })
    }

    //
    if(row.user_id != oauthUser.user_id) {
        return res.status(403).json({
            errors: ["wrong user"],
        })
    }

    //
    const fTitle = typeof req.body.title === 'undefined'
        ? row.title
        : req.body.title

    //
    const fLink = typeof req.body.link === 'undefined'
        ? (row.link === null ? '' : row.link)
        : req.body.link

    //
    const fTextContent = typeof req.body.text_content === 'undefined'
        ? (row.text_content === null ? '' : row.text_content)
        : req.body.text_content

    //
    const [errors, wsCompressedTitle] = await db.validateEditPost(
        fTitle,
        fLink)

    //
    if(errors.length) {
        return res.status(400).json({
            errors: errors,
        })
    }

    //
    await db.updatePost(
        row.post_id,
        wsCompressedTitle,
        fTextContent,
        fLink)

    //
    return res.json({
        post_id: postPublicId,
    })
}

//
module.exports = [isOauthUser, put]
