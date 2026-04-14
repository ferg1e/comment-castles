const db = require('../db')
const {render404} = require('../util/render')

//
async function checkDm(req, res, next) {
    const dmPublicId = req.params[0]
    const {rows:[dm]} = await db.getDmWithPublic(dmPublicId)

    //
    if(!dm) {
        return render404(res,
            `There is no direct message with ID ${dmPublicId}. ` +
            `<a href="/">Return to the home page</a>.`)
    }

    //
    res.locals.dm = dm
    next()
}

//
module.exports.checkDm = checkDm
