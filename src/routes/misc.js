const express = require('express')
const myMisc = require('../util/misc.js')
const config = require('../config')

const router = express.Router()

// every request
function sharedAllHandler(req, res, next) {

    //
    if(parseInt(process.env.IS_PROD) === 1) {
        let host = req.headers.host;

        if(!host.match(/^www\..*/i)) {
            return res.redirect(301, req.protocol + '://www.' + host + req.originalUrl)
        }
    }

    //
    req.app.locals.oneBgColor = myMisc.getOneBgColor(req)
    req.app.locals.twoBgColor = myMisc.getTwoBgColor(req)
    req.app.locals.mainTextColor = myMisc.getMainTextColor(req)
    req.app.locals.postLinkColor = myMisc.getPostLinkColor(req)
    req.app.locals.postLinkVisitedColor = myMisc.getPostLinkVisitedColor(req)
    req.app.locals.groupBgColor = myMisc.getGroupBgColor(req)
    req.app.locals.groupTextColor = myMisc.getGroupTextColor(req)
    req.app.locals.hiddenColor = myMisc.getHiddenColor(req)
    req.app.locals.domainNameColor = myMisc.getDomainNameColor(req)
    req.app.locals.unfollowBgColor = myMisc.getUnfollowBgColor(req)
    req.app.locals.unfollowLineColor = myMisc.getUnfollowLineColor(req)
    req.app.locals.unfollowTextColor = myMisc.getUnfollowTextColor(req)
    req.app.locals.followBgColor = myMisc.getFollowBgColor(req)
    req.app.locals.followLineColor = myMisc.getFollowLineColor(req)
    req.app.locals.followTextColor = myMisc.getFollowTextColor(req)
    req.app.locals.mainLinkColor = myMisc.getMainLinkColor(req)
    req.app.locals.navLinkColor = myMisc.getNavLinkColor(req)

    //
    next()
}

router.route('*')
    .get(sharedAllHandler)
    .post(sharedAllHandler)

router.route('/help')
    .get((req, res) => {
        res.render(
            'instruction-manual',
            {
                html_title: 'Help',
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                default_site_width: config.defaultSiteWidth,
                min_site_width: config.minSiteWidth,
                max_site_width: config.maxSiteWidth,
                default_ppp: config.defaultPostsPerPage,
                min_ppp: config.minPostsPerPage,
                max_ppp: config.maxPostsPerPage,
                default_pvs: config.defaultPostsVerticalSpacing,
                min_pvs: config.minPostsVerticalSpacing,
                max_pvs: config.maxPostsVerticalSpacing,
                admin_public_user_id: config.adminPublicUserId,
            })
    })

router.route('/privacy-policy')
    .get((req, res) => {
        res.render(
            'privacy-policy',
            {
                html_title: 'Privacy Policy',
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })

router.route('/contact-us')
    .get((req, res) => {
        res.render(
            'contact-us',
            {
                html_title: 'Contact Us',
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                contact_email: config.contactEmail
            })
    })

router.route('/api')
    .get((req, res) => {
        res.render(
            'api',
            {
                html_title: 'API',
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })

router.get(
    '/logout',
    (req, res) => {
        req.session.destroy()
        res.redirect('/')
    }
)

module.exports = router
