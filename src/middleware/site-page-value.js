const myMisc = require('../util/misc.js')
const {render400} = require('../util/render')

//
function sitePageValue(req, res, next) {

    //
    const fullPath = req.originalUrl.replace(/\?.*$/, '')
    let page

    try {
        page = myMisc.getPageNum(req)
    }
    catch(e) {
        return render400(res,
            `Invalid pagination page value in URL. ` +
            `This value must be an integer between 1 and ${Number.MAX_SAFE_INTEGER}. ` +
            `<a href="${fullPath}">Return to page 1</a>.`)
    }

    // redirect if p=1 in url
    if(typeof req.query.p !== 'undefined' && page == 1) {
        return res.redirect(301, fullPath)
    }

    //
    res.locals.page = page
    next()
}

//
module.exports.sitePageValue = sitePageValue
