const db = require('../db')
const config = require('../config')
const {isOauthUser} = require('../middleware/is-oauth-user')

//
const del = async (req, res) => {

    //
    const oauthUser = res.locals.oauthUser

    //
    if(typeof req.query.post_id === 'undefined') {
        return res.status(400).json({
            errors: ['no post_id in URL'],
        })
    }

    //
    const postPublicId = req.query.post_id
    const {rows:[row]} = await db.getPostWithPublic(postPublicId)

    //
    if(!row) {
        return res.status(404).json({
            errors: ["no post with that post id"],
        })
    }

    //
    if(row.user_id != oauthUser.user_id &&
        config.adminUserId != oauthUser.user_id &&
        row.lead_mod != oauthUser.user_id)
    {
        return res.status(403).json({
            errors: ["wrong user"],
        })
    }

    //
    db.deletePost(row.post_id)

    //
    return res.json({
        success: true,
    })
}

//
module.exports = [isOauthUser, del]
