const {validatePostSort} = require('../validate/validatePostSort')
const {render400} = require('../util/render')

//
module.exports.sitePostSortValue = (req, res, next) => {

    //
    let sort

    try {
        sort = validatePostSort(req)
    }
    catch(e) {
        const fullPath = req.originalUrl.replace(/\?.*$/, '')

        return render400(res,
            `Invalid sort value in URL. ` +
            `<a href="${fullPath}">Return to page 1</a>.`)
    }

    //
    res.locals.sort = sort
    next()
}
