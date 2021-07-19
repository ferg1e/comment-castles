const express = require('express')
const {body, validationResult} = require('express-validator')
const db = require('../db')
const myMisc = require('../misc.js')

const router = express.Router()
const htmlTitleHome = "Peaches 'n' Stink"
const htmlTitleEditPost = 'Edit Post'
const htmlTitleEditComment = 'Edit Comment'
const htmlTitleComment = 'Comment #'
const htmlTitleManual = 'Manual'

// every request
function sharedAllHandler(req, res, next) {

    //
    if(parseInt(process.env.IS_PROD) === 1) {
        let host = req.headers.host;

        if(!host.match(/^www\..*/i)) {
            return res.redirect(301, req.protocol + '://www.' + host + req.originalUrl)
        }
    }

    next()
}

router.route('*')
    .get(sharedAllHandler)
    .post(sharedAllHandler)

//
router.route('/')
    .get(async (req, res) => {
        let finalUserId = req.session.user ? req.session.user.user_id : -1

        //
        let page = 1

        if(typeof req.query.p !== 'undefined') {
            page = parseInt(req.query.p)

            if(isNaN(page)) {
                return res.redirect('/')
            }
        }

        //
        const isDiscoverMode = myMisc.isDiscover(req)
        const filterUserId = await db.getCurrEyesId(req)

        //
        const {rows} = await db.getPosts(
            finalUserId,
            myMisc.getCurrTimeZone(req),
            page,
            isDiscoverMode,
            filterUserId)

        res.render(
            'posts2',
            {
                html_title: htmlTitleHome,
                user: req.session.user,
                posts: rows,
                page: page,
                base_url: '/',
                is_discover_mode: isDiscoverMode,
                max_width: myMisc.getCurrSiteMaxWidth(req)
            })
    })

router.route('/manual')
    .get((req, res) => {
        res.render(
            'instruction-manual',
            {
                html_title: htmlTitleManual,
                user: req.session.user,
                max_width: myMisc.getCurrSiteMaxWidth(req)
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
                max_width: myMisc.getCurrSiteMaxWidth(req)
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

//single tag: posts
router.get(
    /^\/r\/([a-z0-9-]{3,20})$/,
    async (req, res) => {
        const tag = req.params[0]
        let finalUserId = req.session.user ? req.session.user.user_id : -1

        //
        let page = 1

        if(typeof req.query.p !== 'undefined') {
            page = parseInt(req.query.p)

            if(isNaN(page)) {
                return res.redirect(`/${tag}`)
            }
        }

        //
        const isDiscoverMode = myMisc.isDiscover(req)
        const filterUserId = await db.getCurrEyesId(req)

        //
        const {rows} = await db.getTagPosts(
            finalUserId,
            myMisc.getCurrTimeZone(req),
            page,
            tag,
            isDiscoverMode,
            filterUserId)

        res.render(
            'posts2',
            {
                html_title: tag,
                user: req.session.user,
                posts: rows,
                page: page,
                base_url: `/r/${tag}`,
                is_discover_mode: isDiscoverMode,
                max_width: myMisc.getCurrSiteMaxWidth(req),
                page_tag: tag
            })
    }
)

//edit post
router.route(/^\/p\/([a-z0-9]{22})\/edit$/i)
    .get(async (req, res) => {
        if(req.session.user) {

            //
            const postPublicId = req.params[0]
            const {rows} = await db.getPostWithPublic(postPublicId)

            //
            if(!rows.length) {
                return res.send('unknown post...')
            }

            //
            if(rows[0].user_id != req.session.user.user_id) {
                return res.send('wrong user...')
            }

            //
            res.render(
                'new-post2',
                {
                    html_title: htmlTitleEditPost,
                    user: req.session.user,
                    errors: [],
                    title: rows[0].title,
                    link: rows[0].link === null ? '' : rows[0].link,
                    textContent: rows[0].text_content,
                    tags: rows[0].tags.join(', '),
                    submitLabel: 'Edit Post',
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
        else {
            res.send('sorry...')
        }
    })
    .post(
        (req, res, next) => {

            //remove if blank so it doesn't trigger the validator
            if(req.body.link === '') {
                req.body.link = undefined
            }
    
            next()
        },
        body('text_content', 'Please write some content').optional(),
        body('link', 'link must be a URL to a website').optional().isURL(),
        async (req, res) => {
            if(req.session.user) {

                //
                const postPublicId = req.params[0]
                const {rows} = await db.getPostWithPublic(postPublicId)

                //
                if(!rows.length) {
                    return res.send('unknown post...')
                }

                //
                if(rows[0].user_id != req.session.user.user_id) {
                    return res.send('wrong user...')
                }

                let errors = validationResult(req).array({onlyFirstError:true})

                //
                let [wsCompressedTitle, error] = myMisc.processPostTitle(req.body.title)

                if(error !== null) {
                    errors.push(error)
                }

                //
                let [trimTags, tagErrors] = myMisc.processPostTags(req.body.tags)
                errors = errors.concat(tagErrors)

                //
                if(errors.length) {
                    res.render(
                        'new-post2',
                        {
                            html_title: htmlTitleEditPost,
                            user: req.session.user,
                            errors: errors,
                            title: req.body.title,
                            link: (typeof req.body.link !== 'undefined' ? req.body.link : ''),
                            textContent: req.body.text_content,
                            tags: req.body.tags,
                            submitLabel: 'Edit Post',
                            max_width: myMisc.getCurrSiteMaxWidth(req)
                        })
                }
                else {
                    await db.updatePost(
                        rows[0].post_id,
                        wsCompressedTitle,
                        req.body.text_content,
                        req.body.link)

                    // delete tags for this post
                    await db.deletePostTags(rows[0].post_id)

                    //
                    await db.createPostTags(trimTags, rows[0].post_id)
                    
                    //
                    return res.redirect('/p/' + postPublicId)
                }
            }
            else {
                res.send('nope...')
            }
        }
    )

//edit comment
router.route(/^\/c\/([a-z0-9]{22})\/edit$/i)
    .get(async (req, res) => {
        if(req.session.user) {

            //
            const commentPublicId = req.params[0]
            const {rows} = await db.getCommentWithPublic(commentPublicId)

            //
            if(!rows.length) {
                return res.send('unknown comment...')
            }

            //
            if(rows[0].user_id != req.session.user.user_id) {
                return res.send('wrong user...')
            }

            //
            res.render(
                'edit-comment',
                {
                    html_title: htmlTitleEditComment,
                    user: req.session.user,
                    errors: [],
                    textContent: rows[0].text_content,
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
        else {
            res.send('sorry...')
        }
    })
    .post(async (req, res) => {
            if(req.session.user) {

                //
                const commentPublicId = req.params[0]
                const {rows} = await db.getCommentWithPublic(commentPublicId)

                //
                if(!rows.length) {
                    return res.send('unknown comment...')
                }

                //
                if(rows[0].user_id != req.session.user.user_id) {
                    return res.send('wrong user...')
                }

                //
                let [compressedComment, errors] = myMisc.processComment(req.body.text_content)

                //
                if(errors.length) {
                    res.render(
                        'edit-comment',
                        {
                            html_title: htmlTitleEditComment,
                            user: req.session.user,
                            errors: errors,
                            textContent: "",
                            max_width: myMisc.getCurrSiteMaxWidth(req)
                        })
                }
                else {
                    await db.updateComment(
                        rows[0].comment_id,
                        compressedComment)
                    
                    //
                    return res.redirect('/c/' + commentPublicId)
                }
            }
            else {
                res.send('nope...')
            }
        }
    )

//single comment
router.route(/^\/c\/([a-z0-9]{22})$/i)
    .get(async (req, res) => {
        const commentPublicId = req.params[0]
        const finalUserId = req.session.user ? req.session.user.user_id : -1
        const filterUserId = await db.getCurrEyesId(req)

        const {rows} = await db.getCommentWithPublic2(
            commentPublicId,
            myMisc.getCurrTimeZone(req),
            finalUserId,
            filterUserId)

        if(rows.length) {

            //
            const isDiscoverMode = myMisc.isDiscover(req)

            const{rows:comments} = await db.getCommentComments(
                rows[0].path,
                myMisc.getCurrTimeZone(req),
                finalUserId,
                isDiscoverMode,
                filterUserId)

            res.render(
                'single-comment',
                {
                    html_title: htmlTitleComment + commentPublicId,
                    user: req.session.user,
                    post_public_id: rows[0].post_public_id,
                    comment: rows[0],
                    comments: comments,
                    errors: [],
                    is_discover_mode: isDiscoverMode,
                    comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                }
            )
        }
        else {
            res.send('not found..')
        }
    })
    .post(
        async (req, res) => {
            if(req.session.user) {
                const commentPublicId = req.params[0]
                const finalUserId = req.session.user ? req.session.user.user_id : -1
                const filterUserId = await db.getCurrEyesId(req)

                const {rows} = await db.getCommentWithPublic2(
                    commentPublicId,
                    myMisc.getCurrTimeZone(req),
                    finalUserId,
                    filterUserId)

                if(rows.length) {
                    let [compressedComment, errors] = myMisc.processComment(req.body.text_content)

                    if(errors.length) {

                        //
                        const isDiscoverMode = myMisc.isDiscover(req)

                        const{rows:comments} = await db.getCommentComments(
                            rows[0].path,
                            myMisc.getCurrTimeZone(req),
                            finalUserId,
                            isDiscoverMode,
                            filterUserId)

                        res.render(
                            'single-comment',
                            {
                                html_title: htmlTitleComment + commentPublicId,
                                user: req.session.user,
                                post_public_id: rows[0].post_public_id,
                                comment: rows[0],
                                comments: comments,
                                errors: errors,
                                is_discover_mode: isDiscoverMode,
                                comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
                                max_width: myMisc.getCurrSiteMaxWidth(req)
                            }
                        )
                    }
                    else {

                        //
                        const {rows:data1} = await db.createCommentComment(
                            rows[0].post_id,
                            req.session.user.user_id,
                            compressedComment,
                            rows[0].path,
                            'UTC')

                        //
                        await db.incPostNumComments(rows[0].post_id)
                        return res.redirect(`/c/${commentPublicId}#${data1[0].public_id}`)
                    }
                }
                else {
                    res.send('not found')
                }
            }
            else {
                res.send('nope...')
            }
    })

//
router.route('/inbox')
    .get(async (req, res) => {
        if(req.session.user) {

            //
            const filterUserId = await db.getCurrEyesId(req)
            const isDiscoverMode = myMisc.isDiscover(req)

            //
            let page = 1

            if(typeof req.query.p !== 'undefined') {
                page = parseInt(req.query.p)

                if(isNaN(page)) {
                    return res.redirect('/inbox')
                }
            }

            //
            const{rows:comments} = await db.getInboxComments(
                myMisc.getCurrTimeZone(req),
                req.session.user.user_id,
                isDiscoverMode,
                filterUserId,
                page)

            //
            res.render(
                'inbox',
                {
                    html_title: 'Inbox',
                    user: req.session.user,
                    comments: comments,
                    page: page,
                    is_discover_mode: isDiscoverMode,
                    comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                }
            )
        }
        else {
            res.render(
                'message',
                {
                    html_title: 'Inbox',
                    message: "<a href=\"/login\">Log in</a> to view your inbox.",
                    user: req.session.user,
                    max_width: myMisc.getCurrSiteMaxWidth(req)
                })
        }
    })

//
router.route('/following')
    .get(async (req, res) => {

        //
        const isFollow = typeof req.query.follow !== 'undefined'
        const isFollowed = typeof req.query.followed !== 'undefined'
        const isUnfollow = typeof req.query.unfollow !== 'undefined'
        const isUnfollowed = typeof req.query.unfollowed !== 'undefined'

        if(req.session.user) {

            if(isUnfollow) {
                const userPublicId = req.query.unfollow
                const {rows} = await db.getUserWithPublicId(userPublicId)

                if(rows.length) {

                    //
                    const username = rows[0].username

                    //
                    const {rows:rows2} = await db.getUserFollowee(
                        req.session.user.user_id,
                        rows[0].user_id
                    )

                    //
                    if(rows2.length) {
                        await db.removeFollower(
                            req.session.user.user_id,
                            rows[0].user_id
                        )

                        const redirectUrl = (typeof req.query.goto === 'undefined')
                                ? `/following?unfollowed=${username}`
                                : req.query.goto;

                        return res.redirect(redirectUrl)
                    }
                    else {
                        renderFollowing(req, res,
                            [{msg: 'You are not following that user'}],
                            '')
                    }
                }
                else {
                    renderFollowing(req, res,
                        [{msg: 'No such user'}],
                        '')
                }
            }
            else if(isFollow) {
                const userPublicId = req.query.follow
                const {rows} = await db.getUserWithPublicId(userPublicId)

                if(rows.length) {

                    //
                    const username = rows[0].username

                    //
                    if(req.session.user.user_id == rows[0].user_id) {
                        renderFollowing(req, res,
                            [{msg: 'You don\'t need to follow yourself'}],
                            username)
                    }
                    else {
                        //
                        const {rows:rows2} = await db.getUserFollowee(
                            req.session.user.user_id,
                            rows[0].user_id
                        )

                        //
                        if(rows2.length) {
                            renderFollowing(req, res,
                                [{msg: 'You are already following that user'}],
                                username)
                        }
                        else {
                            await db.addFollower(
                                req.session.user.user_id,
                                rows[0].user_id
                            )

                            const redirectUrl = (typeof req.query.goto === 'undefined')
                                ? `/following?followed=${username}`
                                : req.query.goto;

                            return res.redirect(redirectUrl)
                        }
                    }
                }
                else {
                    renderFollowing(req, res,
                        [{msg: 'No such user'}],
                        '')
                }
            }
            else if(isFollowed) {

                //TODO: should probably check if
                //username exists and is followed by
                //logged in user

                renderFollowing(req, res,
                    [{msg: `You followed ${req.query.followed}`}],
                    '')
            }
            else if(isUnfollowed) {

                //TODO: should probably check if
                //username exists and is not followed by
                //logged in user

                renderFollowing(req, res,
                    [{msg: `You unfollowed ${req.query.unfollowed}`}],
                    '')
            }
            else {
                renderFollowing(req, res, [], '')
            }
        }
        else {
            res.redirect('/sign-up')
        }
    })
    .post(async (req, res) => {
        if(req.session.user) {

            //
            let errors = []

            if(req.body.username === '') {
                errors.push({msg: 'Please fill in a username'})
            }

            //
            if(errors.length) {
                renderFollowing(req, res, errors, req.body.username)
            }
            else {
                const {rows} = await db.getUserWithUsername(req.body.username)

                if(rows.length) {

                    if(req.session.user.user_id == rows[0].user_id) {
                        renderFollowing(req, res,
                            [{msg: 'You don\'t need to follow yourself'}],
                            req.body.username)
                    }
                    else {
                        //
                        const {rows:rows2} = await db.getUserFollowee(
                            req.session.user.user_id,
                            rows[0].user_id
                        )

                        //
                        if(rows2.length) {
                            renderFollowing(req, res,
                                [{msg: 'You are already following that user'}],
                                req.body.username)
                        }
                        else {
                            await db.addFollower(
                                req.session.user.user_id,
                                rows[0].user_id
                            )

                            return res.redirect('/following')
                        }
                    }
                }
                else {
                    renderFollowing(req, res, [{msg: 'No such user'}], req.body.username)
                }
            }
        }
        else {
            res.send('permission denied...')
        }
    })

//
async function renderFollowing(req, res, errors, formUsername) {
    const {rows} = await db.getUserFollowees(req.session.user.user_id)

    //
    res.render(
        'following',
        {
            html_title: 'Following',
            errors: errors,
            user: req.session.user,
            followees: rows,
            formUsername: formUsername,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        }
    )
}

module.exports = router
