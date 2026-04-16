const myMisc = require('../util/misc.js')
const db = require('../db')

//
const all = async (req, res, next) => {

    //
    const theme = myMisc.getCurrTheme(req)
    myMisc.setTheme(theme, req)

    //
    if(req.session.user) {
        const {rows:[row]} = await db.getUserDmCountTotal(req.session.user.user_id)
        req.app.locals.dmTotal = row.total

        const unreadCommentCount = await db.getUserUnreadCommentCount(req.session.user.user_id)
        res.locals.unreadCommentCount = unreadCommentCount
    }

    //
    next()
}

//
module.exports = all
