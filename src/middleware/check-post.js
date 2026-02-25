const db = require('../db')

//
async function checkPost(req, res, next) {
    const postPublicId = req.params[0]
    const {rows:[post]} = await db.getPostWithPublic(postPublicId)

    //
    if(!post) {
        return res.status(404).render('http-error-404', {
            message: `There is no post with ID ${postPublicId}. ` +
                `<a href="/">Return to the home page</a>.`
        })
    }

    //
    res.locals.postPublicId = postPublicId
    res.locals.post = post
    next()
}

//
module.exports.checkPost = checkPost
