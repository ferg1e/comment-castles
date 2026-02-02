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
                `<a href="/">Return to page 1</a>.`
        })
    }

    // if p=1 supplied then redirect to no p in URL
    if(typeof req.query.p !== 'undefined' && page == 1) {
        return res.redirect(301, '/')
    }

    //
    res.locals.page = page
    next()
}

//
module.exports.sitePaginate = sitePaginate
