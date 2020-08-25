const express = require('express')
const argon2 = require('argon2')
const {body, validationResult} = require('express-validator')
const db = require('../db')

const router = express.Router()
const regexUsername = /^[a-z0-9-]{4,16}$/i

// every request
function sharedAllHandler(req, res, next) {
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
router.get(
    '/',
    function(req, res) {
        res.render(
            'index',
            {
                title:'Express',
                user: req.session.user})
    })

router.get(
    '/sign-up',
    (req, res) => {
        if(req.session.user) {
            res.render(
                'message',
                {
                    title: 'Sign Up Form',
                    message: "You already signed up." +
                        " If you want to create another account then please log out.",
                    user: req.session.user
                })
        }
        else {
            res.render(
                'sign-up',
                {
                    title:"Sign Up Form",
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
                {title:"Sign Up Form", errors:errors})
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
                    {title:"Sign Up Form", errors:[
                        {msg:errorMessage}
                    ]})
            }

            res.render(
                'message',
                {
                    title: 'Sign Up Form',
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
                    title: 'Login Form',
                    message: "You're already logged in." +
                        " If you want to log in with a different account then please log out.",
                    user: req.session.user
                })
        }
        else {
            res.render(
                'login',
                {title:"Login Form", errors:[]})
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
            {title:"Login Form", errors:errors})
    }
)

router.route('/my-settings')
    .get(async (req, res) => {
        if(req.session.user) {
            const {rows} = await db.getTimeZones()

            res.render(
                'my-settings',
                {
                    title: 'My Settings',
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
                        title: 'My Settings',
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

//public moderator
router.route('/moderator')
    .get(async (req, res) => {
        if(req.session.user) {

            //
            let isComments = (req.query.what === 'comments')

            //
            let page = 1

            if(typeof req.query.p !== 'undefined') {
                page = parseInt(req.query.p)

                if(isNaN(page)) {
                    if(isComments) {
                        return res.redirect('/moderator?what=comments')
                    }
                    else {
                        return res.redirect('/moderator')
                    }
                }
            }

            //
            const before = typeof req.query.before !== 'undefined'
                ? req.query.before
                : Date.now()/1000

            //
            if(isComments) {
                const {rows} = await db.getAllUserVisibleComments(
                    getCurrTimeZone(req),
                    req.session.user.user_id,
                    req.session.user.is_super_admin,
                    page,
                    before)

                res.render(
                    'moderator-comments',
                    {
                        title: 'Comments Moderator',
                        user: req.session.user,
                        comments: rows,
                        page: page,
                        before: before
                    })
            }
            else {
                const {rows} = await db.getAllUserVisiblePosts(
                    getCurrTimeZone(req),
                    req.session.user.user_id,
                    req.session.user.is_super_admin,
                    page,
                    before)

                res.render(
                    'moderator',
                    {
                        title: 'Public Moderator',
                        user: req.session.user,
                        posts: rows,
                        page: page,
                        before: before
                    })
            }
        }
        else {
            res.send('log in to use the moderator')
        }
    })
    .post(async (req, res) => {
        if(req.session.user) {

            //
            let canRemove = false
            let canMarkSpam = false

            //
            const isRemovePost = typeof req.body.remove_post_id !== 'undefined'
            const isSpamPost = typeof req.body.spam_post_id !== 'undefined'
            const isRemoveComment = typeof req.body.remove_comment_id !== 'undefined'
            const isSpamComment = typeof req.body.spam_comment_id !== 'undefined'

            //
            if(isRemovePost) {
                const {rows} = await db.getPostWithPublic(req.body.remove_post_id)

                if(rows.length) {
                    const {rows:rows2} = await db.canMarkPostRemoved(
                        req.session.user.user_id,
                        rows[0].post_id,
                        rows[0].group_id)
                    
                    canRemove = req.session.user.is_super_admin || rows2[0]['can_remove']
                }
                else {
                    return res.send('error: post not found or access denied')
                }
            }
            else if(isRemoveComment) {
                const {rows} = await db.getCommentWithPublic(req.body.remove_comment_id)

                if(rows.length) {
                    const {rows:rows2} = await db.canMarkCommentRemoved(
                        req.session.user.user_id,
                        rows[0].comment_id,
                        rows[0].group_id)
                    
                    canRemove = req.session.user.is_super_admin || rows2[0]['can_remove']
                }
                else {
                    return res.send('error: comment not found or access denied')
                }
            }
            else if(isSpamPost) {
                const {rows} = await db.getPostWithPublic(req.body.spam_post_id)

                if(rows.length) {
                    const {rows:rows2} = await db.canMarkPostSpam(
                        req.session.user.user_id,
                        rows[0].post_id,
                        rows[0].group_id)
                    
                    canMarkSpam = req.session.user.is_super_admin || rows2[0]['can_mark_spam']
                }
                else {
                    return res.send('error: post not found or access denied')
                }
            }
            else if(isSpamComment) {
                const {rows} = await db.getCommentWithPublic(req.body.spam_comment_id)

                if(rows.length) {
                    const {rows:rows2} = await db.canMarkCommentSpam(
                        req.session.user.user_id,
                        rows[0].comment_id,
                        rows[0].group_id)
                    
                    canMarkSpam = req.session.user.is_super_admin || rows2[0]['can_mark_spam']
                }
                else {
                    return res.send('error: post not found or access denied')
                }
            }

            //
            if(canRemove && isRemovePost) {
                await db.markPostRemoved(req.body.remove_post_id)

                return res.redirect(req.url)
            }
            else if(canRemove && isRemoveComment) {
                await db.markCommentRemoved(req.body.remove_comment_id)

                return res.redirect(req.url)
            }
            else if(canMarkSpam && isSpamPost) {
                let postPublicId = req.body.spam_post_id
                let userId = req.session.user.user_id

                await db.markPostSpam(userId, postPublicId)
                return res.redirect(req.url)
            }
            else if(canMarkSpam && isSpamComment) {
                let commentPublicId = req.body.spam_comment_id
                let userId = req.session.user.user_id

                await db.markCommentSpam(userId, commentPublicId)
                return res.redirect(req.url)
            }
            else {
                res.send('dont you do it mr.')
            }
        }
        else {
            res.send('log in to use the moderator')
        }
    })

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

//new post
router.route('/new')
    .get(async (req, res) => {
        if(req.session.user) {
            res.render(
                'new-post2',
                {
                    user: req.session.user,
                    errors: [],
                    title: "",
                    link: "",
                    textContent: ""
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
                const errors = validationResult(req).array({onlyFirstError:true})
    
                if(errors.length) {
                    res.render(
                        'new-post2',
                        {
                            user: req.session.user,
                            errors: errors,
                            title: req.body.title,
                            link: (typeof req.body.link !== 'undefined' ? req.body.link : ''),
                            textContent: req.body.text_content
                        })
                }
                else {
                    let vals = db.createPost(
                        req.session.user.user_id,
                        req.body.title,
                        req.body.text_content,
                        req.body.link)
    
                    await vals[0]
    
                    //return res.redirect('/g/' + res.locals.group.name + '/' + vals[1])
                    return res.send('id: ' + vals[1]);
                }
            }
            else {
                res.send('nope...')
            }
        }
    )

//group: moderate home
/*router.get(
    /^\/g\/([a-z0-9-]{3,36})\/moderate$/i,
    async (req, res) => {
        if(res.locals.isMod) {
            res.render(
                'group-moderate-home',
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

//group: moderate posts
router.route(/^\/g\/([a-z0-9-]{3,36})\/moderate\/posts$/i)
    .get(async (req, res) => {
        if(res.locals.isMod) {
            const {rows:posts} = await db.getPostsWithGroupId(res.locals.group.group_id, getCurrTimeZone(req))

            res.render(
                'group-moderate-posts',
                {
                    posts: posts,
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
    })
    .post(async (req, res) => {
        if(res.locals.isMod) {
            if(typeof req.body.remove_post_id !== 'undefined') {
                await db.markPostRemoved(req.body.remove_post_id)
                const {rows:posts} = await db.getPostsWithGroupId(res.locals.group.group_id, getCurrTimeZone(req))

                res.render(
                    'group-moderate-posts',
                    {
                        posts: posts,
                        user: req.session.user,
                        name: res.locals.group.name,
                        is_admin: res.locals.isAdmin,
                        is_mod: res.locals.isMod
                    }
                )
            }
            else {
                res.send('dont you do it mr.')
            }
        }
        else {
            res.send('you dont have permission')
        }
    })

//group: moderate comments
router.route(/^\/g\/([a-z0-9-]{3,36})\/moderate\/comments$/i)
    .get(async (req, res) => {
        if(res.locals.isMod) {
            const {rows:comments} = await db.getCommentsWithGroupId(res.locals.group.group_id, getCurrTimeZone(req))

            res.render(
                'group-moderate-comments',
                {
                    comments: comments,
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
    })
    .post(async (req, res) => {
        if(res.locals.isMod) {
            if(typeof req.body.remove_comment_id !== 'undefined') {
                await db.markCommentRemoved(req.body.remove_comment_id)
                const {rows:comments} = await db.getCommentsWithGroupId(res.locals.group.group_id, getCurrTimeZone(req))

                res.render(
                    'group-moderate-comments',
                    {
                        comments: comments,
                        user: req.session.user,
                        name: res.locals.group.name,
                        is_admin: res.locals.isAdmin,
                        is_mod: res.locals.isMod
                    }
                )
            }
            else {
                res.send('dont you do it mr.')
            }
        }
        else {
            res.send('permission denied')
        }
    })*/

//single post
router.route(/^\/([a-z0-9_-]{7,14})$/i)
    .get(async (req, res) => {
        const postPublicId = req.params[0]

        const {rows} = await db.getPostWithPublic2(
            postPublicId,
            getCurrTimeZone(req))

        if(rows.length) {
            const{rows:comments} = await db.getPostComments(
                rows[0].post_id,
                getCurrTimeZone(req))

            res.render(
                'single-post',
                {
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

                const {rows} = await db.getPostWithPublic2(
                    postPublicId,
                    getCurrTimeZone(req))

                if(rows.length) {
                    const errors = validationResult(req).array({onlyFirstError:true})

                    if(errors.length) {
                        const{rows:comments} = await db.getPostComments(rows[0].post_id, getCurrTimeZone(req))

                        res.render(
                            'single-post',
                            {
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
                        ++rows[0].num_comments;

                        //
                        const{rows:comments} = await db.getPostComments(rows[0].post_id, getCurrTimeZone(req))

                        res.render(
                            'single-post',
                            {
                                user: req.session.user,
                                post: rows[0],
                                comments: comments,
                                errors: []
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
