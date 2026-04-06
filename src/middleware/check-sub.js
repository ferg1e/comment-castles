const db = require('../db')
const {render404} = require('../util/render')

//
async function checkSub(req, res, next) {
    const subSlug = req.params[0]
    const {rows:[sub]} = await db.getSub(subSlug)

    //
    if(!sub) {
        return render404(res,
            `The ${subSlug} sub does not exist yet. ` +
            `You can start this sub by <a href="/new?sub=${subSlug}">posting to it</a>. ` +
            `Or <a href="/">return to the home page</a>.`)
    }

    //
    res.locals.subSlug = subSlug
    res.locals.sub = sub
    next()
}

//
module.exports.checkSub = checkSub
