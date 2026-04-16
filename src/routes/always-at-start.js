const myMisc = require('../util/misc.js')
const db = require('../db')

//
const all = async (req, res, next) => {

    //todo: probably want to put this no www redirect in nginx/apache
    if(parseInt(process.env.IS_PROD) === 1) {
        let host = req.headers.host;

        if(!host.match(/^www\..*/i)) {
            return res.redirect(301, req.protocol + '://www.' + host + req.originalUrl)
        }
    }

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
