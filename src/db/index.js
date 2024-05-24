const argon2 = require('argon2')
const config = require('../config')
const myMisc = require('../util/misc.js')
const {Pool, types} = require('pg')
const {customAlphabet} = require('nanoid')
const nanoidAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const nanoidLen = 22
const oauthClientIdLen = 32

//
const genId = customAlphabet(
    nanoidAlphabet,
    nanoidLen,
)

const genOauthId = customAlphabet(
    nanoidAlphabet,
    oauthClientIdLen,
)

//returns raw timestamp instead of converting to a js Date obj
types.setTypeParser(1114, str => str)

const pool = new Pool()

function query(query, params) {
    return pool.query(query, params)
}

//user
exports.createUser = async (username, password) => {

    /*
    Insert all default settings values here instead of relying on
    SQL column defaults so that we can easily change the defaults
    one place (ie. in the config file).
    */
    return await argon2.hash(password)
        .then(hash => query(`
            insert into tuser (
                username,
                password,
                public_id,
                time_zone,
                comment_reply_mode,
                post_layout,
                site_width,
                posts_per_page,
                posts_vertical_spacing,
                theme,
                date_format)
            values
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            returning
                user_id,
                username,
                public_id,
                time_zone,
                post_layout,
                posts_per_page,
                posts_vertical_spacing,
                theme,
                comment_reply_mode,
                site_width,
                date_format`,
            [
                username,
                hash,
                genId(),
                config.defaultTimeZone,
                config.defaultCommentReplyMode,
                config.defaultPostLayout,
                config.defaultSiteWidth !== '' ? config.defaultSiteWidth : null,
                config.defaultPostsPerPage,
                config.defaultPostsVerticalSpacing,
                config.defaultTheme,
                config.defaultDateFormat,
            ]))
}

exports.getUserWithUsername = (username) => {
    return query(`
        select
            user_id,
            public_id,
            username,
            password,
            time_zone,
            post_layout,
            posts_per_page,
            posts_vertical_spacing,
            theme,
            comment_reply_mode,
            site_width,
            date_format
        from
            tuser
        where
            lower(username) = lower($1)`,
        [username]
    )
}

//TODO: consider combining this with getUserWithUsername()
exports.getUserWithPublicId = (publicId) => {
    return query(`
        select
            user_id,
            username,
            password,
            time_zone,
            comment_reply_mode,
            site_width,
            profile_blurb
        from
            tuser
        where
            public_id = $1`,
        [publicId]
    )
}

exports.getUserWithUserId = (userId) => {
    return query(`
        select
            username,
            password,
            profile_blurb,
            public_id
        from
            tuser
        where
            user_id = $1`,
        [userId]
    )
}

exports.getUsersWithoutPublicId = () => {
    return query(`
        select
            user_id
        from
            tuser
        where
            public_id = ''`)
}

exports.updateUser = (userId, timeZoneName, commentReplyMode, siteWidth, postLayout, postsPerPage, postsVerticalSpacing, theme, dateFormat) => {
    return query(`
        update
            tuser
        set
            time_zone = $1,
            comment_reply_mode = $2,
            site_width = $3,
            post_layout = $4,
            posts_per_page = $5,
            posts_vertical_spacing = $6,
            theme = $7,
            date_format = $8
        where
            user_id = $9`,
        [timeZoneName, commentReplyMode, siteWidth, postLayout, postsPerPage, postsVerticalSpacing, theme, dateFormat, userId])
}

//
exports.updateUserUsername = (userId, username) => {
    return query(`
        update
            tuser
        set
            username = $1
        where
            user_id = $2`,
        [username, userId])
}

//
exports.updateUserProfile = (userId, profile) => {
    const finalProfile = profile.trim() === '' ? null : profile

    return query(`
        update
            tuser
        set
            profile_blurb = $1
        where
            user_id = $2`,
        [finalProfile, userId])
}

//
exports.genUserPublicId = (userId) => {
    return query(`
        update
            tuser
        set
            public_id = $1
        where
            user_id = $2 and
            public_id = ''`,
        [
            genId(),
            userId
        ])
}

//post
exports.createPost = async (userId, title, textContent, link, trimCastle) => {
    const newPublicPostId = genId()
    const finalLink = link !== '' ? link : null
    const finalTextContent = textContent.trim() === '' ? null : textContent

    //
    let domainNameId = null

    if(link !== '') {
        const domainName = myMisc.getDomainName(link)
        domainNameId = await module.exports.getDomainNameId(domainName)
    }

    //
    let subId = null
    const {rows:[existingSub]} = await module.exports.getSub(trimCastle)

    if(existingSub) {
        subId = existingSub.sub_id
    }
    else {
        const {rows:[newSub]} = await module.exports.createSub(trimCastle, userId)
        subId = newSub.sub_id
    }


    //
    const {rows:[row]} = await query(`
        insert into tpost
            (public_id, user_id, title, text_content, link,
            domain_name_id, sub_id)
        values
            ($1, $2, $3, $4, $5,
            $6, $7)
        returning
            post_id, title, text_content, link, created_on`,
        [newPublicPostId, userId, title, finalTextContent, finalLink,
        domainNameId, subId]
    )

    //
    return {
        post_id: newPublicPostId,
        title: row.title,
        link: row.link,
        post_text: row.text_content,
        post_time: row.created_on,
        //by: v.username,
        //num_comments: v.num_comments,
        sub: trimCastle,
    }
}

exports.getPosts = async (timeZone, page, sort, pageSize, dateFormat) => {
    return query(`
        select
            p.public_id,
            p.title,
            to_char(
                timezone($1, p.created_on),
                $2) created_on,
            p.created_on created_on_raw,
            u.username,
            u.user_id,
            u.public_id as user_public_id,
            p.link,
            p.num_comments,
            case
                when p.domain_name_id is null then null
                else (select domain_name from tdomainname where domain_name_id = p.domain_name_id)
                end domain_name,
            s.slug castle,
            s.lead_mod
        from
            tpost p
        join
            tuser u on u.user_id = p.user_id
        join
            tsub s on s.sub_id = p.sub_id
        order by
            case when $3 = '' then p.created_on end desc,

            case when $4 = 'oldest' then p.created_on end asc,

            case when $5 = 'comments' then p.num_comments end desc,
            case when $6 = 'comments' then p.created_on end desc,

            case when $7 = 'last' then p.last_comment end desc nulls last,
            case when $8 = 'last' then p.created_on end desc
        limit
            $9
        offset
            $10`,
        [timeZone, dateFormat, sort, sort, sort, sort, sort, sort, pageSize, (page - 1)*pageSize]
    )
}

//TODO: very similar to getPosts(), may want to combine
exports.getTagPosts = async (timeZone, page, castle, sort, pageSize, dateFormat) => {
    return query(`
        select
            p.public_id,
            p.title,
            to_char(
                timezone($1, p.created_on),
                $2) created_on,
            u.username,
            u.user_id,
            u.public_id as user_public_id,
            p.link,
            p.num_comments,
            dn.domain_name,
            s.slug castle,
            s.lead_mod
        from
            tpost p
        join
            tuser u on u.user_id = p.user_id
        join
            tsub s on s.sub_id = p.sub_id
        left join
            tdomainname dn on dn.domain_name_id = p.domain_name_id
        where
            s.slug = $3
        order by
            case when $4 = '' then p.created_on end desc,

            case when $5 = 'oldest' then p.created_on end asc,

            case when $6 = 'comments' then p.num_comments end desc,
            case when $7 = 'comments' then p.created_on end desc,

            case when $8 = 'last' then p.last_comment end desc nulls last,
            case when $9 = 'last' then p.created_on end desc
        limit
            $10
        offset
            $11`,
        [timeZone, dateFormat, castle, sort, sort, sort, sort, sort, sort, pageSize, (page - 1)*pageSize]
    )
}

exports.getPostWithPublic = (publicId) => {
    return query(`
        select
            p.post_id,
            p.user_id,
            p.title,
            p.text_content,
            p.link,
            s.slug castle,
            s.lead_mod
        from
            tpost p
        join
            tsub s on s.sub_id = p.sub_id
        where
            p.public_id = $1`,
        [publicId]
    )
}

exports.getPostWithPublic2 = (publicId, timeZone, dateFormat) => {
    return query(`
        select
            p.post_id,
            p.title,
            to_char(
                timezone($1, p.created_on),
                $2) created_on,
            p.created_on created_on_raw,
            p.text_content,
            u.username,
            u.user_id,
            u.public_id as user_public_id,
            p.public_id,
            p.link,
            p.num_comments,
            dn.domain_name,
            s.slug castle,
            s.lead_mod
        from
            tpost p
        join
            tuser u on u.user_id = p.user_id
        join
            tsub s on s.sub_id = p.sub_id
        left join
            tdomainname dn on dn.domain_name_id = p.domain_name_id
        where
            p.public_id = $3`,
        [timeZone, dateFormat, publicId]
    )
}

exports.getPostLinks = () => {
    return query(`
        select
            post_id,
            link
        from
            tpost
        where
            link is not null`)
}

exports.updatePost = async (postId, title, textContent, link) => {
    const finalLink = link !== '' ? link : null
    const finalTextContent = textContent.trim() === '' ? null : textContent

    //
    let domainNameId = null

    if(link !== '') {
        const domainName = myMisc.getDomainName(link)
        domainNameId = await module.exports.getDomainNameId(domainName)
    }

    //
    await query(`
        update
            tpost
        set
            title = $1,
            link = $2,
            text_content = $3,
            domain_name_id = $4
        where
            post_id = $5`,
        [title, finalLink, finalTextContent, domainNameId, postId])
}

exports.incPostNumComments = (postId) => {
    return query(`
        update
            tpost
        set
            num_comments = num_comments +1
        where
            post_id = $1`,
        [postId])
}

exports.updatePostDomainNameId = (postId, domainNameId) => {
    return query(`
        update
            tpost
        set
            domain_name_id = $1
        where
            post_id = $2`,
        [domainNameId, postId])
}

exports.setLastCommentTimes = () => {
    return query(`
        update
            tpost p
        set
            last_comment = (
                select
                    max(created_on)
                from
                    tcomment
                where
                    post_id = p.post_id
            )`,
        [])
}

exports.deletePost = (postId) => {
    return query(`
        delete from
            tpost
        where
            post_id = $1`,
        [postId])

    //post comments also delete via FK
}

//
exports.validateNewPost = async (title, link, castle) => {

    //
    let errors = []

    //
    const urlRegex = /(https?):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|]/ig
    const isValidLink = 
        link === '' ||
        urlRegex.test(link)

    if(!isValidLink) {
        errors.push({msg: 'link must be an http or https URL'})
    }

    //
    let [wsCompressedTitle, error] = myMisc.processPostTitle(title)

    if(error !== null) {
        errors.push(error)
    }

    //
    const [trimCastle, castleErrors] = myMisc.processPostCastle(castle)
    errors = errors.concat(castleErrors)

    //
    if(errors.length == 0) {
        const {rows:[sub]} = await module.exports.getSub(trimCastle)

        if(sub && sub.is_post_locked) {
            errors.push({msg: 'no new posts allowed for this sub'})
        }
    }

    //
    return [errors, wsCompressedTitle, trimCastle]
}

//
exports.validateEditPost = async (title, link) => {

    //
    let errors = []

    //
    const isValidLink = 
        link === '' ||
        config.singleUrlRegex.test(link)

    if(!isValidLink) {
        errors.push({msg: 'link must be an http or https URL'})
    }

    //
    let [wsCompressedTitle, error] = myMisc.processPostTitle(title)

    if(error !== null) {
        errors.push(error)
    }

    //
    return [errors, wsCompressedTitle]
}

//domain name
exports.createDomainName = (domainName) => {
    return query(`
        insert into tdomainname
            (domain_name)
        values
            ($1)
        returning
            domain_name_id`,
        [domainName])
}

exports.getDomainName = (domainName) => {
    return query(`
        select
            domain_name_id
        from
            tdomainname
        where
            domain_name = $1`,
        [domainName])
}

exports.getDomainNameId = async domainName => {
    const {rows} = await module.exports.getDomainName(domainName)

    if(rows.length) {
        return rows[0].domain_name_id
    }
    else {
        const {rows:rowsNew} = await module.exports.createDomainName(domainName)
        return rowsNew[0].domain_name_id
    }
}

//comment
exports.createPostComment = async (postId, userId, content) => {

    /*TODO: figure out how to put this postId in
    the query as a query param, currently
    concat returns type 'text' which the ~
    operator doesn't accept*/
    const lQuery = parseInt(postId) + '.*{1}'

    // get next ltree path int based on most recent ltree path
    const {rows:[row]} = await query(`
        select
            path
        from
            tcomment
        where
            path ~ $1
        order by
            path desc
        limit
            1`,
        [lQuery])

    let nextPathInt = 1

    if(row) {
        const lastDotIndex = row.path.lastIndexOf('.')
        const lastTriple = row.path.substring(lastDotIndex + 1)
        nextPathInt = myMisc.orderedAlphaToNum(lastTriple) + 1
    }

    //
    return query(`
        insert into tcomment
            (post_id, user_id, text_content, path, public_id)
        values
            ($1, $2, $3, $4, $5)
        returning
            public_id, text_content, created_on`,
        [postId, userId, content,
            postId + '.' + myMisc.numToOrderedAlpha(nextPathInt),
            genId()])
}

exports.createCommentComment = async (postId, userId, content, parentPath, timeZone, dateFormat) => {
    const lQuery = parentPath + '.*{1}'

    // get next ltree path int based on most recent ltree path
    const {rows:[row]} = await query(`
        select
            path
        from
            tcomment
        where
            path ~ $1
        order by
            path desc
        limit
            1`,
        [lQuery])

    let nextPathInt = 1

    if(row) {
        const lastDotIndex = row.path.lastIndexOf('.')
        const lastTriple = row.path.substring(lastDotIndex + 1)
        nextPathInt = myMisc.orderedAlphaToNum(lastTriple) + 1
    }

    return query(`
        insert into tcomment
            (post_id, user_id, text_content, path, public_id)
        values
            ($1, $2, $3, $4, $5)
        returning
            public_id,
            text_content,
            created_on as created_on_raw,
            to_char(
                timezone($6, created_on),
                $7) created_on`,
        [postId, userId, content,
            parentPath + '.' + myMisc.numToOrderedAlpha(nextPathInt),
            genId(),
            timeZone,
            dateFormat])
}

exports.getInboxComments = (timeZone, userId, page, dateFormat) => {
    const pageSize = 20

    return query(`
        select
            c.text_content,
            c.path,
            u.username,
            u.user_id,
            u.public_id as user_public_id,
            to_char(
                timezone($1, c.created_on),
                $2) created_on,
            c.public_id,
            s.lead_mod
        from
            tcomment c
        join
            tuser u on u.user_id = c.user_id
        join
            tpost p on p.post_id = c.post_id
        join
            tsub s on s.sub_id = p.sub_id
        where
            (nlevel(c.path) = 2 and p.user_id = $3) or
            (nlevel(c.path) > 2 and (select user_id from tcomment where path = subpath(c.path, 0, -1)) = $4)
        order by
            c.created_on desc
        limit
            $5
        offset
            $6`,
        [timeZone, dateFormat, userId, userId,
            pageSize, (page - 1)*pageSize])
}

exports.getPostComments = (postId, timeZone, page, dateFormat) => {
    const limit = config.commentsPerPage
    const offset = (page - 1)*config.commentsPerPage

    return query(`
        select
            c.text_content,
            c.path,
            u.username,
            u.user_id,
            u.public_id as user_public_id,
            to_char(
                timezone($1, c.created_on),
                $2) created_on,
            c.created_on created_on_raw,
            c.public_id
        from
            tcomment c
        join
            tuser u on u.user_id = c.user_id
        where
            c.path <@ $3
        order by
            c.path
        limit
            $4
        offset
            $5`,
        [timeZone, dateFormat, postId, limit, offset])
}

// count query for above query
// their two where clauses need to remain identical
exports.getPostNumComments = (postId) => {
    return query(`
        select
            count(1) as count
        from
            tcomment c
        where
            c.path <@ $1`,
        [postId])
}

//
exports.getCommentComments = (path, timeZone, page, dateFormat) => {
    const limit = config.commentsPerPage
    const offset = (page - 1)*config.commentsPerPage

    return query(`
        select
            c.text_content,
            c.path,
            u.username,
            u.user_id,
            u.public_id as user_public_id,
            to_char(
                timezone($1, c.created_on),
                $2) created_on,
            c.created_on created_on_raw,
            c.public_id
        from
            tcomment c
        join
            tuser u on u.user_id = c.user_id
        where
            c.path <@ $3 and
            not (c.path ~ $4)
        order by
            c.path
        limit
            $5
        offset
            $6`,
        [timeZone, dateFormat, path, path, limit, offset])
}

// this is copied from the above query
// it's the "count only" version of the query
// ie. it uses the same "where" as above
// these two where clauses need to stay the same
exports.getCommentNumComments = (path) => {
    return query(`
        select
            count(1) as count
        from
            tcomment c
        where
            c.path <@ $1 and
            not (c.path ~ $2)`,
        [path, path])
}

exports.getCommentWithPublic = (publicId) => {
    return query(`
        select
            c.comment_id,
            c.post_id,
            c.path,
            c.user_id,
            c.text_content,
            s.slug castle,
            s.lead_mod
        from
            tcomment c
        join
            tpost p on p.post_id = c.post_id
        join
            tsub s on s.sub_id = p.sub_id
        where
            c.public_id = $1`,
        [publicId]
    )
}

exports.getCommentWithPublic2 = (publicId, timeZone, dateFormat) => {
    return query(`
        select
            c.text_content,
            to_char(
                timezone($1, c.created_on),
                $2) created_on,
            c.created_on created_on_raw,
            c.path,
            c.post_id,
            c.public_id comment_public_id,
            u.username,
            u.user_id,
            u.public_id as user_public_id,
            p.public_id post_public_id,
            s.slug castle,
            s.lead_mod
        from
            tcomment c
        join
            tuser u on u.user_id = c.user_id
        join
            tpost p on p.post_id = c.post_id
        join
            tsub s on s.sub_id = p.sub_id
        where
            c.public_id = $3`,
        [timeZone, dateFormat, publicId]
    )
}

exports.updateComment = (commentId, textContent) => {
    return query(`
        update
            tcomment
        set
            text_content = $1
        where
            comment_id = $2`,
        [textContent, commentId])
}

exports.deleteComment = async (path) => {

    // delete the comment and all its sub comments
    await query(`
        delete from
            tcomment
        where
            path <@ $1`,
        [path])
}

//sub
exports.createSub = (slug, leadModUserId) => {
    return query(`
        insert into tsub
            (slug, lead_mod)
        values
            (lower($1), $2)
        returning
            sub_id`,
        [slug, leadModUserId]
    )
}

//
exports.getSub = (slug) => {
    return query(`
        select
            s.sub_id,
            s.lead_mod,
            s.sub_desc,
            s.is_post_locked,
            u.public_id lead_mod_public_id,
            u.username lead_mod_username
        from
            tsub s
        join
            tuser u on u.user_id = s.lead_mod
        where
            slug = lower($1)`,
        [slug]
    )
}

//
exports.updateSub = (subId, desc) => {
    const finalDesc = desc.trim() === '' ? null : desc

    return query(`
        update
            tsub
        set
            sub_desc = $1
        where
            sub_id = $2`,
        [finalDesc, subId]
    )
}

//oauth client
exports.createClient = (appName, redirectUri, userId) => {

    //
    const publicClientId = genOauthId()

    //
    return query(`
        insert into toauthclient
            (user_id, app_name, redirect_uri, public_client_id)
        values
            ($1, $2, $3, $4)
        returning
            public_client_id`,
        [userId, appName, redirectUri, publicClientId])
}

//
exports.getClient = (publicClientId) => {
    return query(`
        select
            client_id,
            redirect_uri,
            user_id,
            app_name,
            public_client_id
        from
            toauthclient
        where
            public_client_id = $1`,
        [publicClientId])
}

//
exports.getUserClients = (userId) => {
    return query(`
        select
            public_client_id,
            app_name
        from
            toauthclient
        where
            user_id = $1`,
        [userId])
}

//
exports.updateClient = (clientId, appName, redirectUri) => {
    return query(`
        update
            toauthclient
        set
            app_name = $1,
            redirect_uri = $2
        where
            client_id = $3`,
        [appName, redirectUri, clientId])
}

//oauth authorization codes
exports.createAuthCode = (clientId, userId, code, redirectUri, expires, codeChallenge, codeChallengeMethod) => {
    return query(`
        insert into toauthauthcode
            (client_id, logged_in_user_id, code, redirect_uri, expires_on, code_challenge, cc_method)
        values
            ($1, $2, $3, $4, $5::timestamptz, $6, $7)`,
        [clientId, userId, code, redirectUri, expires, codeChallenge, codeChallengeMethod])
}

//
exports.getAuthCode = (code) => {
    return query(`
        select
            ac.redirect_uri,
            ac.expires_on,
            ac.logged_in_user_id,
            ac.cc_method,
            ac.code_challenge,
            c.public_client_id
        from
            toauthauthcode ac
        join
            toauthclient c on c.client_id = ac.client_id
        where
            ac.code = $1`,
        [code])
}

//
exports.deleteAuthCode = (code) => {
    return query(`
        delete from
            toauthauthcode
        where
            code = $1`,
        [code]
    )
}

//oauth access token
exports.createAccessToken = (clientId, userId, token, expires) => {
    return query(`
        insert into toauthaccesstoken
            (client_id, logged_in_user_id, token, expires_on)
        values
            ($1, $2, $3, $4::timestamptz)`,
        [clientId, userId, token, expires])
}

//
exports.getAccessToken = (token) => {
    return query(`
        select
            at.expires_on,
            at.logged_in_user_id,
            c.public_client_id,
            u.time_zone
        from
            toauthaccesstoken at
        join
            toauthclient c on c.client_id = at.client_id
        join
            tuser u on u.user_id = at.logged_in_user_id
        where
            at.token = $1`,
        [token])
}

//dms
exports.createDm = (fromUserId, toUserId, message) => {
    return query(`
        insert into tdirectmessage
            (from_user_id, to_user_id, dmessage)
        values
            ($1, $2, $3)`,
        [fromUserId, toUserId, message])
}

//
exports.getDmedUsers = (loggedInUser) => {
    return query(`
        select
            case
                when fu.user_id = $1 then tu.username
                else fu.username
            end dmed_username,

            case
                when fu.user_id = $2 then tu.public_id
                else fu.public_id
            end dmed_user_public_id,

            max(dm.created_on) most_recent
        from
            tdirectmessage dm
        join
            tuser fu on fu.user_id = dm.from_user_id
        join
            tuser tu on tu.user_id = dm.to_user_id
        where
            dm.from_user_id = $3 or
            dm.to_user_id = $4
        group by
            dmed_user_public_id, dmed_username
        order by
            most_recent`,
        [loggedInUser, loggedInUser, loggedInUser, loggedInUser])
}

//
exports.getPairDms = (loggedInUserId, otherUserId) => {
    return query(`
        select
            dm.dmessage,
            dm.created_on,
            fu.username from_username
        from
            tdirectmessage dm
        join
            tuser fu on fu.user_id = dm.from_user_id
        where
            (dm.from_user_id = $1 and dm.to_user_id = $2) or
            (dm.from_user_id = $3 and dm.to_user_id = $4)
        order by
            dm.created_on desc`,
        [loggedInUserId, otherUserId, otherUserId, loggedInUserId])
}

//misc
exports.getTimeZoneWithName = (timeZoneName) => {
    return query(`
        select
            name,
            abbrev,
            utc_offset,
            is_dst
        from
            pg_timezone_names
        where
            name = $1`,
        [timeZoneName]
    )
}

exports.getTimeZones = () => {
    return query(`
        select
            name,
            utc_offset
        from
            pg_timezone_names
        where
            name not like 'Etc/%' and
            name not like 'GMT%' and
            name not like 'posix%'
        order by
            utc_offset, name`
    )
}
