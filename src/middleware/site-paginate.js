const myMisc = require('../util/misc.js')

//
function sitePaginate(req, res, next) {

    //
    let page

    try {
        page = myMisc.getPageNum(req)
    }
    catch(e) {
        return res.status(400).render('http-error-400', {
            message: `Invalid pagination page value in URL. ` +
                `This value must be an integer between 1 and ${Number.MAX_SAFE_INTEGER}. ` +
                `<a href="${req.path}">Return to page 1</a>.`
        })
    }

    // redirect if p=1 in url
    if(typeof req.query.p !== 'undefined' && page == 1) {
        return res.redirect(301, req.path)
    }

    //
    res.locals.page = page
    next()
}

//
module.exports.sitePaginate = sitePaginate
