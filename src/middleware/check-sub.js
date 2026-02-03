const db = require('../db')

//
async function checkSub(req, res, next) {
    const subSlug = req.params[0]
    const {rows:[sub]} = await db.getSub(subSlug)

    //
    if(!sub) {
        return res.status(404).render('http-error-404', {
            message: `The ${subSlug} sub does not exist yet. ` +
                `You can start this sub by <a href="/new?sub=${subSlug}">posting to it</a>. ` +
                `Or <a href="/">return to the home page</a>.`
        })
    }

    //
    res.locals.subSlug = subSlug
    res.locals.sub = sub
    next()
}

//
module.exports.checkSub = checkSub
