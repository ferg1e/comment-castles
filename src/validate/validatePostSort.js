module.exports.validatePostSort = req => {

    //
    const rawSort = req.query.sort
    
    //
    if(typeof rawSort === 'undefined') {
        return '' //default value (newest)
    }

    //
    const validValues = ['oldest', 'comments', 'last']

    //
    if(validValues.indexOf(rawSort) == -1) {
        throw Error('invalid post sort value')
    }

    //
    return rawSort
}
