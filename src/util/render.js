module.exports.render400 = (res, message) => {
    return res.status(400).render('http-error-400', {
        message: message
    })
}

//
module.exports.render401 = (res, message) => {
    return res.status(401).render('http-error-401', {
        message: message
    })
}

//
module.exports.render403 = (res, message) => {
    return res.status(403).render('http-error-403', {
        message: message
    })
}

//
module.exports.render404 = (res, message) => {
    return res.status(404).render('http-error-404', {
        message: message
    })
}

//
module.exports.renderMessage = (req, res, title, message, mainClass = '') => {
    return res.render('message', {
        html_title: title,
        message: message,
        user: req.session.user,
        main_class: mainClass
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
