const {getPageNum} = require('../util/validate')

//
function apiPageValue(req, res, next) {

    //
    let page

    try {
        page = getPageNum(req)
    }
    catch(e) {
        return res.status(400).json({
            errors: [`Invalid pagination page value. ` +
                `This value must be an integer between 1 and ${Number.MAX_SAFE_INTEGER}.`],
        })
    }

    //
    res.locals.page = page
    next()
}

//
module.exports.apiPageValue = apiPageValue
