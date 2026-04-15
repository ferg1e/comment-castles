const {render403} = require('../util/render')

//
function isDmOwner(req, res, next) {

    // checkDm() middleware must have already been called
    const dm = res.locals.dm

    // isUser() middleware must have already been called
    const userId = req.session.user.user_id

    //
    const isOwner = userId == dm.from_user_id

    //
    if(!isOwner) {
        return render403(res,
            `You are not the owner of this direct message, and ` +
            `therefore you cannot edit or delete it. `
            `<a href="/">Return to the home page</a>.`)
    }

    //
    next()
}

//
module.exports.isDmOwner = isDmOwner
