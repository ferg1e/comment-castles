const db = require('../db')
const config = require('../config')
const {oauthAuthenticate} = require('../util/oauth-authenticate')

//
const del = async (req, res) => {

    //
    const oauthData = await oauthAuthenticate(req, res)

    //
    if(!oauthData) {
        return res.status(401).json({
            errors: ['invalid or no user auth'],
        })
    }

    //
    if(typeof req.query.comment_id === 'undefined') {
        return res.status(400).json({
            errors: ['no comment_id in URL'],
        })
    }

    //
    const commentPublicId = req.query.comment_id
    const {rows:[row]} = await db.getCommentWithPublic(commentPublicId)

    //
    if(!row) {
        return res.status(404).json({
            errors: ["no comment with that comment id"],
        })
    }

    //
    if(row.user_id != oauthData.user.user_id &&
        config.adminUserId != oauthData.user.user_id &&
        row.lead_mod != oauthData.user.user_id)
    {
        return res.status(403).json({
            errors: ["wrong user"],
        })
    }

    //
    await db.deleteComment(row.path)

    //
    return res.json({
        success: true,
    })
}

//
module.exports = del
