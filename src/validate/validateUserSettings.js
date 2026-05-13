const db = require('../db')
const config = require('../config')

//
module.exports.validateUserSettings = async req => {

    //
    const {rows} = await db.getTimeZoneWithName(req.body.time_zone)

    //
    const errors = []

    if(!rows.length) {
        errors.push('unknown time zone, pick again')
    }

    //
    const siteWidthInt = parseInt(req.body.site_width)
    const wisNaN = isNaN(siteWidthInt)
    const widthOkay = (req.body.site_width === '') ||
        (!wisNaN && siteWidthInt >= config.minSiteWidth && siteWidthInt <= config.maxSiteWidth)

    if(!widthOkay) {
        errors.push(`site width must be between ${config.minSiteWidth}-${config.maxSiteWidth}, or left blank`)
    }

    //
    const postsPerPageInt = parseInt(req.body.posts_per_page)
    const pppIsNaN = isNaN(postsPerPageInt)
    const pppOkay = !pppIsNaN &&
        postsPerPageInt >= config.minPostsPerPage &&
        postsPerPageInt <= config.maxPostsPerPage

    if(!pppOkay) {
        errors.push(`posts per page must be between ${config.minPostsPerPage}-${config.maxPostsPerPage}`)
    }

    //
    const postsVerticalSpacingInt = parseInt(req.body.posts_vertical_spacing)
    const pvsIsNaN = isNaN(postsVerticalSpacingInt)
    const pvsOkay = !pvsIsNaN &&
        postsVerticalSpacingInt >= config.minPostsVerticalSpacing &&
        postsVerticalSpacingInt <= config.maxPostsVerticalSpacing

    if(!pvsOkay) {
        errors.push(`posts vertical spacing must be between ${config.minPostsVerticalSpacing}-${config.maxPostsVerticalSpacing}`)
    }

    //
    return errors
}
