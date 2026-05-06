const userSettings = require('../util/user-settings.js')
const db = require('../db')

//
const all = async (req, res, next) => {

    //
    res.locals.max_width = userSettings.getCurrSiteMaxWidth(req)

    //
    const theme = userSettings.getCurrTheme(req)
    userSettings.setTheme(theme, res)

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
