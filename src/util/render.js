module.exports.render404 = (res, message) => {
    return res.status(404).render('http-error-404', {
        message: message
    })
}
