const express = require('express')
const argon2 = require('argon2')
const {body, validationResult} = require('express-validator')
const db = require('../db')

const router = express.Router()
const regexUsername = /^[a-z0-9-]{4,16}$/i
const htmlTitleHome = "Peaches 'n' Stink"
const htmlTitleSignUp = 'Sign Up'
const htmlTitleLogin = 'Log In'
const htmlTitleSettings = 'Settings'
const htmlTitleNewPost = 'New Post'
const htmlTitlePost = 'Post #'
const htmlTitleComment = 'Comment #'
const htmlTitleTags = 'Tags'

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
    if(req.session.user) {
        let superUserIds = [1]
        let isSuperAdmin = superUserIds.indexOf(req.session.user.user_id) !== -1
        req.session.user.is_super_admin = isSuperAdmin
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
        const {rows} = await db.getPosts(finalUserId, getCurrTimeZone(req), page)

        res.render(
            'posts2',
            {
                html_title: htmlTitleHome,
                user: req.session.user,
                posts: rows,
                page: page,
                base_url: '/'
            })
    })

//
/*router.route('/tags')
    .get(async (req, res) => {
        
        //
        const {rows} = await db.getTags()

        res.render(
            'tags',
            {
                html_title: htmlTitleTags,
                user: req.session.user,
                tags: rows
            })
    })*/

router.get(
    '/sign-up',
    (req, res) => {
        if(req.session.user) {
            res.render(
                'message',
                {
                    html_title: htmlTitleSignUp,
                    message: "You already signed up." +
                        " If you want to create another account then please log out.",
                    user: req.session.user
                })
        }
        else {
            res.render(
                'sign-up',
                {
                    html_title: htmlTitleSignUp,
                    errors:[]
                })
        }
    }
)

router.post(
    '/sign-up',
    body('username', 'Username must be 4-16 characters(letters, numbers and dashes only)')
        .notEmpty().withMessage('Please fill in a username')
        .matches(regexUsername),
    body('password', 'Password must be 13-100 characters')
        .notEmpty().withMessage('Please fill in a password')
        .matches(/^.{13,100}$/),
    async (req, res) => {
        let errors = validationResult(req).array({onlyFirstError:true})

        if(errors.length) {
            res.render(
                'sign-up',
                {
                    html_title: htmlTitleSignUp,
                    errors:errors
                })
        }
        else {
            const {username, password} = req.body

            try {
                await db.createUser(username, password)
            }
            catch(err) {
                let errorMessage = (err.constraint == 'username_unique_idx')
                    ? `"${username}" already taken`
                    : 'unknown error, please try again'
                
                //
                return res.render(
                    'sign-up',
                    {
                        html_title: htmlTitleSignUp,
                        errors:[{msg:errorMessage}]
                    })
            }

            res.render(
                'message',
                {
                    html_title: htmlTitleSignUp,
                    message: "Sign up was successful, you can now log in.",
                    user: req.session.user
                })
        }
    }
)

router.get(
    '/login',
    (req, res) => {
        if(req.session.user) {
            res.render(
                'message',
                {
                    html_title: htmlTitleLogin,
                    message: "You're already logged in." +
                        " If you want to log in with a different account then please log out.",
                    user: req.session.user
                })
        }
        else {
            res.render(
                'login',
                {
                    html_title: htmlTitleLogin,
                    errors:[]})
        }
    }
)

router.post(
    '/login',
    async (req, res) => {
        let errors = []
        const {rows} = await db.getUserWithUsername(req.body.username)

        if(rows.length) {
            try {
                if(await argon2.verify(rows[0].password, req.body.password)) {
                    req.session.user = {
                        user_id: rows[0].user_id,
                        username: rows[0].username,
                        time_zone: rows[0].time_zone
                    }

                    return res.redirect('/')
                }
                else {
                    errors.push('Invalid username and password')
                }
            }
            catch(err) {
                errors.push('Unknown error, please try it again')
            }
        }
        else {
            errors.push('Invalid username and password')
        }

        res.render(
            'login',
            {
                html_title: htmlTitleLogin,
                errors:errors})
    }
)

router.route('/settings')
    .get(async (req, res) => {
        if(req.session.user) {
            const {rows} = await db.getTimeZones()

            res.render(
                'my-settings',
                {
                    html_title: htmlTitleSettings,
                    errors: [],
                    user: req.session.user,
                    time_zones: rows
                })
        }
        else {
            res.send('log in to see your settings...')
        }
    })
    .post(async (req, res) => {
        if(req.session.user) {
            const {rows} = await db.getTimeZoneWithName(req.body.time_zone)

            if(rows.length) {
                await db.updateUser(req.session.user.user_id, req.body.time_zone)
                req.session.user.time_zone = req.body.time_zone

                const {rows:rows2} = await db.getTimeZones()

                res.render(
                    'my-settings',
                    {
                        html_title: htmlTitleSettings,
                        errors: [{msg: 'Settings successfully saved.'}],
                        user: req.session.user,
                        time_zones: rows2
                    })
            }
            else {
                res.send('error')
            }
        }
        else {
            res.send('log in to see your settings...')
        }
    })

router.get(
    '/logout',
    (req, res) => {
        req.session.destroy()
        res.redirect('/')
    }
)

//group: shared
async function sharedGroupHandler(req, res, next) {
    const groupName = req.params[0]
    const {rows} = await db.getGroupWithName(groupName)

    if(rows.length) {

        //
        const isUser = (typeof req.session.user != 'undefined')
        const group = rows[0]

        let isAdmin = false
        let isMod = false
        let isPoster = false
        let isCommenter = false
        let isMember = false

        let canPost = false
        let canComment = false

        if(isUser) {
            isAdmin = req.session.user.user_id == group.owned_by

            //
            const {rows:members} = await db.getGroupMember(group.group_id, req.session.user.user_id)

            if(members.length) {
                const member = members[0]
                isMod = member.is_moderator
                isPoster = member.is_poster
                isCommenter = member.is_commenter
                isMember = true
            }

            //
            isMod = isMod || isAdmin
            isPoster = isPoster || isAdmin
            isCommenter = isCommenter || isAdmin
            isMember = isMember || isAdmin

            //canPost
            //view = anyone
            if(group.group_viewing_mode == 'anyone') {
                if(group.group_posting_mode == 'anyone-that-can-view') {
                    canPost = true
                }
                else {
                    canPost = isPoster
                }
            }

            //view = members only
            else {
                if(group.group_posting_mode == 'anyone-that-can-view') {
                    canPost = isMember
                }
                else {
                    canPost = isPoster
                }
            }

            //canComment
            //view = anyone
            if(group.group_viewing_mode == 'anyone') {
                if(group.group_commenting_mode == 'anyone-that-can-view') {
                    canComment = true
                }
                else {
                    canComment = isCommenter
                }
            }

            //view = members only
            else {
                if(group.group_commenting_mode == 'anyone-that-can-view') {
                    canComment = isMember
                }
                else {
                    canComment = isCommenter
                }
            }
        }

        //
        res.locals.group = group
        res.locals.isAdmin = isAdmin
        res.locals.isMod = isMod
        res.locals.canPost = canPost
        res.locals.canComment = canComment
        res.locals.isMember = isMember

        //
        if(group.group_viewing_mode == 'members-only' && !res.locals.isMember) {
            res.send('you don\'t have permission')
        }
        else {
            next()
        }
    }
    else {
        res.send('no such group')
    }
}

router.route(/^\/g\/([a-z0-9-]{3,36})/i)
    .get(sharedGroupHandler)
    .post(sharedGroupHandler)

//group: posts
router.get(
    /^\/g\/([a-z0-9-]{3,36})$/i,
    async (req, res) => {
        const group = res.locals.group
        const {rows} = await db.getPostsWithGroupId(
            group.group_id,
            getCurrTimeZone(req))

        res.render(
            'group-posts',
            {
                user: req.session.user,
                name: group.name,
                posts: rows,
                is_admin: res.locals.isAdmin,
                is_mod: res.locals.isMod
            })
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
        const {rows} = await db.getTagPosts(finalUserId, getCurrTimeZone(req), page, tag)

        res.render(
            'posts2',
            {
                html_title: tag,
                user: req.session.user,
                posts: rows,
                page: page,
                base_url: `/r/${tag}`
            })
    }
)

//new post
router.route('/new')
    .get(async (req, res) => {
        if(req.session.user) {
            res.render(
                'new-post2',
                {
                    html_title: htmlTitleNewPost,
                    user: req.session.user,
                    errors: [],
                    title: "",
                    link: "",
                    textContent: "",
                    tags: ""
                })
        }
        else {
            res.send('log in to post')
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
        body('title', 'Title must be 4-50 characters')
            .notEmpty().withMessage('Please fill in a title')
            .matches(/^.{4,50}$/i),
        body('text_content', 'Please write some content').optional(),
        body('link', 'link must be a URL to a website').optional().isURL(),
        async (req, res) => {
            if(req.session.user) {
                let errors = validationResult(req).array({onlyFirstError:true})

                //
                let tags = req.body.tags.split(',')
                let trimTags = []

                for(let i = 0; i < tags.length; ++i) {
                    let trimTag = tags[i].trim().toLowerCase()

                    if(trimTag !== "" && trimTags.indexOf(trimTag) == -1) {
                        trimTags.push(trimTag)
                    }
                }

                //
                let isCharError = false
                let isLenError = false

                for(let i = 0; i < trimTags.length; ++i) {
                    let isMatch = trimTags[i].match(/^[0-9a-zA-Z-]+$/)

                    if(!isCharError && isMatch === null) {
                        errors.push({'msg': 'tags can only contain numbers, letters and dashes'})
                        isCharError = true
                    }

                    let tagLen = trimTags[i].length
                    let isLenOkay = tagLen >= 3 && tagLen <= 20

                    if(!isLenError && !isLenOkay) {
                        errors.push({'msg': 'each tag must be 3-20 characters'})
                        isLenError = true
                    }
                }

                //
                if(trimTags.length > 4) {
                    errors.push({'msg': 'the max tags per post is 4'})
                }

                //
                if(errors.length) {
                    res.render(
                        'new-post2',
                        {
                            html_title: htmlTitleNewPost,
                            user: req.session.user,
                            errors: errors,
                            title: req.body.title,
                            link: (typeof req.body.link !== 'undefined' ? req.body.link : ''),
                            textContent: req.body.text_content,
                            tags: req.body.tags
                        })
                }
                else {
                    let vals = db.createPost(
                        req.session.user.user_id,
                        req.body.title,
                        req.body.text_content,
                        req.body.link)
    
                    const {rows} = await vals[0]

                    //
                    let tagIds = []

                    for(let i = 0; i < trimTags.length; ++i) {
                        const {rows:tagd} = await db.getTag(trimTags[i])

                        if(tagd.length) {
                            tagIds.push(tagd[0].tag_id)
                        }
                        else {
                            const {rows:tagInsert} = await db.createTag(trimTags[i])
                            tagIds.push(tagInsert[0].tag_id)
                        }
                    }

                    //
                    for(let i = 0; i < tagIds.length; ++i) {
                        await db.createPostTag(tagIds[i], rows[0].post_id)
                    }
                    
                    //
                    return res.redirect('/p/' + vals[1])
                }
            }
            else {
                res.send('nope...')
            }
        }
    )

//single post
router.route(/^\/p\/([a-z0-9]{22})$/i)
    .get(async (req, res) => {
        const postPublicId = req.params[0]
        const finalUserId = req.session.user ? req.session.user.user_id : -1

        const {rows} = await db.getPostWithPublic2(
            postPublicId,
            getCurrTimeZone(req),
            finalUserId)

        if(rows.length) {
            const{rows:comments} = await db.getPostComments(
                rows[0].post_id,
                getCurrTimeZone(req),
                finalUserId)

            res.render(
                'single-post',
                {
                    html_title: htmlTitlePost + postPublicId,
                    user: req.session.user,
                    post: rows[0],
                    comments: comments,
                    errors: []
                }
            )
        }
        else {
            res.send('not found')
        }
    })
    .post(
        body('text_content', 'Please write a comment').notEmpty(),
        async (req, res) => {

            if(req.session.user) {
                const postPublicId = req.params[0]
                const finalUserId = req.session.user ? req.session.user.user_id : -1

                const {rows} = await db.getPostWithPublic2(
                    postPublicId,
                    getCurrTimeZone(req),
                    finalUserId)

                if(rows.length) {
                    const errors = validationResult(req).array({onlyFirstError:true})

                    if(errors.length) {
                        const{rows:comments} = await db.getPostComments(
                            rows[0].post_id,
                            getCurrTimeZone(req),
                            finalUserId)

                        res.render(
                            'single-post',
                            {
                                html_title: htmlTitlePost + postPublicId,
                                user: req.session.user,
                                post: rows[0],
                                comments: comments,
                                errors: errors
                            }
                        )
                    }
                    else {

                        //
                        const {rows:data1} = await db.createPostComment(
                            rows[0].post_id,
                            req.session.user.user_id,
                            req.body.text_content)

                        //
                        await db.incPostNumComments(rows[0].post_id)
                        return res.redirect(`/p/${postPublicId}`)
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

//single comment
router.route(/^\/c\/([a-z0-9]{22})$/i)
    .get(async (req, res) => {
        const commentPublicId = req.params[0]
        const finalUserId = req.session.user ? req.session.user.user_id : -1

        const {rows} = await db.getCommentWithPublic2(
            commentPublicId,
            getCurrTimeZone(req),
            finalUserId)

        if(rows.length) {
            const{rows:comments} = await db.getCommentComments(
                rows[0].path,
                getCurrTimeZone(req),
                finalUserId)

            res.render(
                'single-comment',
                {
                    html_title: htmlTitleComment + commentPublicId,
                    user: req.session.user,
                    post_public_id: rows[0].post_public_id,
                    comment: rows[0],
                    comments: comments,
                    errors: []
                }
            )
        }
        else {
            res.send('not found..')
        }
    })
    .post(
        body('text_content', 'Please write some content').notEmpty(),
        async (req, res) => {
            if(req.session.user) {
                const commentPublicId = req.params[0]
                const finalUserId = req.session.user ? req.session.user.user_id : -1

                const {rows} = await db.getCommentWithPublic2(
                    commentPublicId,
                    getCurrTimeZone(req),
                    finalUserId)

                if(rows.length) {
                    const errors = validationResult(req).array({onlyFirstError:true})

                    if(errors.length) {
                        const{rows:comments} = await db.getCommentComments(
                            rows[0].path,
                            getCurrTimeZone(req),
                            finalUserId)

                        res.render(
                            'single-comment',
                            {
                                html_title: htmlTitleComment + commentPublicId,
                                user: req.session.user,
                                post_public_id: rows[0].post_public_id,
                                comment: rows[0],
                                comments: comments,
                                errors: errors
                            }
                        )
                    }
                    else {

                        //
                        const {rows:data1} = await db.createCommentComment(
                            rows[0].post_id,
                            req.session.user.user_id,
                            req.body.text_content,
                            rows[0].path)

                        //
                        await db.incPostNumComments(rows[0].post_id)
                        return res.redirect(`/c/${commentPublicId}`)
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

//group: single comment
router.route(/^\/g\/([a-z0-9-]{3,36})\/([a-z0-9_-]{7,14})\/([a-z0-9_-]{7,14})$/i)
    .get(async (req, res) => {
        const postPublicId = req.params[1]
        const commentPublicId = req.params[2]

        const {rows} = await db.getCommentWithGroupAndPublics(
            res.locals.group.name,
            postPublicId,
            commentPublicId,
            getCurrTimeZone(req))

        if(rows.length) {
            const{rows:comments} = await db.getCommentComments(rows[0].path, getCurrTimeZone(req))

            res.render(
                'group-comment',
                {
                    user: req.session.user,
                    name: res.locals.group.name,
                    post_public_id: postPublicId,
                    comment: rows[0],
                    comments: comments,
                    errors: [],
                    is_admin: res.locals.isAdmin,
                    is_mod: res.locals.isMod,
                    can_comment: res.locals.canComment
                }
            )
        }
        else {
            res.send('not found..')
        }
    })
    .post(
        body('text_content', 'Please write some content').notEmpty(),
        async (req, res) => {
            if(res.locals.canComment) {
                const postPublicId = req.params[1]
                const commentPublicId = req.params[2]

                const {rows} = await db.getCommentWithGroupAndPublics(
                    res.locals.group.name,
                    postPublicId,
                    commentPublicId,
                    getCurrTimeZone(req))

                if(rows.length) {
                    const errors = validationResult(req).array({onlyFirstError:true})

                    if(errors.length) {
                        const{rows:comments} = await db.getCommentComments(rows[0].path, getCurrTimeZone(req))

                        res.render(
                            'group-comment',
                            {
                                user: req.session.user,
                                name: res.locals.group.name,
                                post_public_id: postPublicId,
                                comment: rows[0],
                                comments: comments,
                                errors: errors,
                                is_admin: res.locals.isAdmin,
                                is_mod: res.locals.isMod,
                                can_comment: res.locals.canComment
                            }
                        )
                    }
                    else {

                        //
                        const {rows:data1} = await db.createCommentComment(
                            rows[0].post_id,
                            req.session.user.user_id,
                            req.body.text_content,
                            rows[0].path)

                        //
                        await db.incPostNumComments(rows[0].post_id)

                        //
                        const{rows:comments} = await db.getCommentComments(rows[0].path, getCurrTimeZone(req))

                        res.render(
                            'group-comment',
                            {
                                user: req.session.user,
                                name: res.locals.group.name,
                                post_public_id: postPublicId,
                                comment: rows[0],
                                comments: comments,
                                errors: [],
                                is_admin: res.locals.isAdmin,
                                is_mod: res.locals.isMod,
                                can_comment: res.locals.canComment
                            }
                        )
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

//group: admin
router.get(
    /^\/g\/([a-z0-9-]{3,36})\/admin$/i,
    async (req, res) => {
        if(res.locals.isAdmin) {
            res.render(
                'group-admin-home',
                {
                    user: req.session.user,
                    name: res.locals.group.name,
                    is_admin: res.locals.isAdmin,
                    is_mod: res.locals.isMod
                }
            )
        }
        else {
            res.send('you dont have permission')
        }
    }
)

router.route('/following')
    .get(async (req, res) => {

        //
        const isFollow = typeof req.query.follow !== 'undefined'
        const isFollowed = typeof req.query.followed !== 'undefined'
        const isUnfollow = typeof req.query.unfollow !== 'undefined'
        const isUnfollowed = typeof req.query.unfollowed !== 'undefined'

        if(req.session.user) {

            if(isUnfollow) {
                let username = req.query.unfollow
                const {rows} = await db.getUserWithUsername(username)

                if(rows.length) {

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
                let username = req.query.follow
                const {rows} = await db.getUserWithUsername(username)

                if(rows.length) {
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
                        username)
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
            formUsername: formUsername
        }
    )
}

//group: admin add member
router.route(/^\/g\/([a-z0-9-]{3,36})\/admin\/members$/i)
    .get((req, res) => {
        if(res.locals.isAdmin) {
            renderAdminMember(req, res, [])
        }
        else {
            res.send('you dont have permission')
        }
    })
    .post(
        async (req, res) => {
            if(res.locals.isAdmin) {
                
                //update member
                if(typeof req.body.save_user_id !== 'undefined') {
                    let isModerator = typeof req.body.is_moderator != 'undefined'
                    let isPoster = typeof req.body.is_poster != 'undefined'
                    let isCommenter = typeof req.body.is_commenter != 'undefined'

                    await db.updateMember(
                        res.locals.group.group_id,
                        req.body.save_user_id,
                        isModerator,
                        isPoster,
                        isCommenter)

                    //
                    const {rows} = await db.getUserWithUserId(req.body.save_user_id)

                    renderAdminMember(
                        req,
                        res,
                        [{msg: `member ${rows[0].username} successfully saved`}])
                }

                //delete member
                else if(typeof req.body.remove_user_id !== 'undefined') {
                    await db.deleteMember(res.locals.group.group_id, req.body.remove_user_id)
                    renderAdminMember(req, res, [])
                }

                //add member
                else {
                    let errors = []

                    if(req.body.username === '') {
                        errors.push({msg: 'Please fill in a username'})
                    }

                    //
                    if(errors.length) {
                        renderAdminMember(req, res, errors)
                    }
                    else {
                        const {rows} = await db.getUserWithUsername(req.body.username)
    
                        if(rows.length) {
                            const mIndex = res.locals.group.members.indexOf(rows[0].user_id)
                            const isUserMember = (mIndex != -1)
                            const isUserAdmin = (rows[0].user_id == res.locals.group.owned_by)
    
                            if(isUserMember || isUserAdmin) {
                                renderAdminMember(req, res, [{msg: 'that user is already a member'}])
                            }
                            else {
                                await db.createMember(rows[0].user_id, res.locals.group.group_id)
                                renderAdminMember(req, res, [])
                            }
                        }
                        else {
                            renderAdminMember(req, res, [{msg: 'no such user'}])
                        }
                    }
                }
            }
            else {
                res.send('you dont have permission')
            }
        })

//
async function renderAdminMember(req, res, errors) {
    const {rows} = await db.getGroupMembers(res.locals.group.group_id)

    res.render(
        'group-admin-add-member',
        {
            errors: errors,
            user: req.session.user,
            name: res.locals.group.name,
            is_admin: res.locals.isAdmin,
            is_mod: res.locals.isMod,
            members: rows
        }
    )
}

//group: admin settings
router.route(/^\/g\/([a-z0-9-]{3,36})\/admin\/settings$/i)
    .get((req, res) => {
        if(res.locals.isAdmin) {
            res.render(
                'group-admin-settings',
                {
                    errors: [],
                    user: req.session.user,
                    name: res.locals.group.name,
                    is_admin: res.locals.isAdmin,
                    is_mod: res.locals.isMod,
                    group_post_mode: res.locals.group.group_posting_mode,
                    group_comment_mode: res.locals.group.group_commenting_mode
                }
            )
        }
        else {
            res.send('you dont have permission')
        }
    })
    .post(
        async (req, res) => {
            if(res.locals.isAdmin) {
                await db.updateGroupSettings(
                    res.locals.group.group_id,
                    req.body.group_post_mode,
                    req.body.group_comment_mode)

                res.render(
                    'group-admin-settings',
                    {
                        errors: [{msg: 'Settings successfully saved.'}],
                        user: req.session.user,
                        name: res.locals.group.name,
                        is_admin: res.locals.isAdmin,
                        is_mod: res.locals.isMod,
                        group_post_mode: req.body.group_post_mode,
                        group_comment_mode: req.body.group_comment_mode
                    }
                )
            }
            else {
                res.send('you dont have permission')
            }
        })

module.exports = router

//util
function getCurrTimeZone(req) {
    return req.session.user ? req.session.user.time_zone : 'UTC'
}
