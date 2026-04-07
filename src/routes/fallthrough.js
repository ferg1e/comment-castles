const {render404} = require('../util/render')

//
const all = (req, res) => {
    return render404(res,
        `Unsupported URL. ` +
        `<a href="/">Return to the home page</a>.`)
}

//
module.exports = all
