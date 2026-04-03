module.exports.render404 = (res, message) => {
    return res.status(404).render('http-error-404', {
        message: message
    })
}

//
module.exports.renderPaginate404 = (req, res, page, numPages) => {

    //
    const baseUrl = req.originalUrl.replace(/\?.*$/, '')

    //
    return module.exports.render404(res,
        `There are only ${numPages} pages and ` +
        `you tried to access page ${page}. ` +
        `<a href="${baseUrl}">Return to page 1</a>.`)
}
