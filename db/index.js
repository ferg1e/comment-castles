const argon2 = require('argon2')
const config = require('../config')
const myMisc = require('../misc.js')
const {Pool, types} = require('pg')
const nanoid = require('nanoid/generate');
const nanoidAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
const nanoidLen = 22;

//returns raw timestamp instead of converting to a js Date obj
types.setTypeParser(1114, str => str)

const pool = new Pool()

function query(query, params) {
    return pool.query(query, params)
}

function numToOrderedAlpha(num) {
    var first = Math.ceil(num/676)

    var second = Math.ceil(num/26)%26
    second = second ? second : 26

    var third = Math.ceil(num%26)
    third = third ? third : 26

    return String.fromCharCode(96 + first) +
        String.fromCharCode(96 + second) +
        String.fromCharCode(96 + third)
}

//user
exports.createUser = (username, password) => {
    return argon2.hash(password)
        .then(hash => query(`
            insert into tuser
                (username, password, public_id)
            values
                ($1, $2, $3)
            returning
                user_id, username, time_zone, post_mode, eyes, comment_reply_mode, site_width`,
            [
                username,
                hash,
                nanoid(nanoidAlphabet, nanoidLen)
            ]))
}

exports.getUserWithUsername = (username) => {
    return query(`
        select
            user_id,
            username,
            password,
            time_zone,
            post_mode,
            is_eyes,
            eyes,
            comment_reply_mode,
            site_width
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
            post_mode,
            is_eyes,
            eyes,
            comment_reply_mode,
            site_width
        from
            tuser
        where
            public_id = $1`,
        [publicId]
    )
}

exports.getAvailableEyes = () => {
    return query(`
        select
            username
        from
            tuser
        where
            is_eyes
        order by
            lower(username)`,
        []
    )
}

exports.getCurrEyesId = async req => {
    if(req.session.user) {
        return req.session.user.eyes
            ? req.session.user.eyes
            : req.session.user.user_id
    }
    else {
        let username = config.eyesDefaultUsername

        if(typeof req.cookies.eyes !== 'undefined') {
            if(req.cookies.eyes === '') {
                return -1
            }
            else {
                username = req.cookies.eyes
            }
        }

        //
        const {rows} = await module.exports.getUserWithUsername(username)

        if(rows.length && rows[0].is_eyes) {
            return rows[0].user_id
        }
        else {
            return -1
        }
    }
}

exports.getUserWithUserId = (userId) => {
    return query(`
        select
            username,
            password
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

exports.updateUser = (userId, timeZoneName, postMode, commentReplyMode, siteWidth, eyes) => {
    return query(`
        update
            tuser
        set
            time_zone = $1,
            post_mode = $2,
            comment_reply_mode = $3,
            eyes = $4,
            site_width = $5
        where
            user_id = $6`,
        [timeZoneName, postMode, commentReplyMode, eyes, siteWidth, userId])
}

//
exports.updateUserViewMode = (userId, postMode) => {
    return query(`
        update
            tuser
        set
            post_mode = $1
        where
            user_id = $2`,
        [postMode, userId])
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
            nanoid(nanoidAlphabet, nanoidLen),
            userId
        ])
}

//post
exports.createPost = (userId, title, textContent, link, domainNameId) => {
    let newPostId = nanoid(nanoidAlphabet, nanoidLen)
    let finalLink = typeof link !== 'undefined' ? link : null
    let finalTextContent = textContent.trim() === '' ? null : textContent

    let promise = query(`
        insert into tpost
            (public_id, user_id, title, text_content, link,
            domain_name_id)
        values
            ($1, $2, $3, $4, $5,
            $6)
        returning
            post_id`,
        [newPostId, userId, title, finalTextContent, finalLink,
        domainNameId]
    )

    return [promise, newPostId]
}

exports.getPosts = async (userId, timeZone, page, isDiscoverMode, filterUserId, sort) => {
    let pageSize = 20
    const numLeadingPlaceholders = 9
    const allowedPrivateIds = []
    const dynamicPlaceholders = []

    if(userId != -1) {

        //
        const {rows} = await module.exports.getUserAllPrivateGroupIds(userId)

        for(const i in rows) {
            allowedPrivateIds.push(rows[i].private_group_id)
        }

        for(let i = 1; i <= allowedPrivateIds.length; ++i) {
            const placeholderNum = numLeadingPlaceholders + i
            dynamicPlaceholders.push(`$${placeholderNum}`)
        }
    }

    const pAfter = numLeadingPlaceholders + allowedPrivateIds.length + 1

    const beforeParams = [timeZone, userId, filterUserId, filterUserId, userId, isDiscoverMode,
        userId, filterUserId, filterUserId]

    const afterParams = [sort, sort, sort, sort, sort, sort,
        pageSize, (page - 1)*pageSize]

    const finalParams = beforeParams.concat(allowedPrivateIds, afterParams)

    return query(`
        select
            p.public_id,
            p.title,
            to_char(
                timezone($1, p.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
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
            u.user_id = $2 or u.user_id = $3 or
                exists(select
                        1
                    from
                        tfollower
                    where
                        followee_user_id = u.user_id and
                        user_id = $4) is_visible,
            exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $5) is_follow,
            array(
                select
                    t.tag
                from
                    ttag t
                join
                    tposttag pt on pt.tag_id = t.tag_id
                where
                    pt.post_id = p.post_id) tags
        from
            tpost p
        join
            tuser u on u.user_id = p.user_id
        where
            not is_removed and
            ($6 or u.user_id = $7 or u.user_id = $8 or
                exists(select
                        1
                    from
                        tfollower
                    where
                        followee_user_id = u.user_id and
                        user_id = $9)) and
            (array(
                select
                    pg.private_group_id
                from
                    tprivategroup pg
                join
                    ttag t on t.tag = pg.name
                join
                    tposttag pt on pt.tag_id = t.tag_id
                where
                    pt.post_id = p.post_id) <@ Array[${dynamicPlaceholders.join()}]::integer[])
        order by
            case when $${pAfter} = '' then p.created_on end desc,

            case when $${pAfter+1} = 'oldest' then p.created_on end asc,

            case when $${pAfter+2} = 'comments' then p.num_comments end desc,
            case when $${pAfter+3} = 'comments' then p.created_on end desc,

            case when $${pAfter+4} = 'last' then p.last_comment end desc nulls last,
            case when $${pAfter+5} = 'last' then p.created_on end desc
        limit
            $${pAfter+6}
        offset
            $${pAfter+7}`,
        finalParams
    )
}

//TODO: very similar to getPosts(), may want to combine
exports.getTagPosts = async (userId, timeZone, page, tag, isDiscoverMode, filterUserId, sort) => {
    let pageSize = 20
    const numLeadingPlaceholders = 10
    const allowedPrivateIds = []
    const dynamicPlaceholders = []

    if(userId != -1) {

        //
        const {rows} = await module.exports.getUserAllPrivateGroupIds(userId)

        for(const i in rows) {
            allowedPrivateIds.push(rows[i].private_group_id)
        }

        for(let i = 1; i <= allowedPrivateIds.length; ++i) {
            const placeholderNum = numLeadingPlaceholders + i
            dynamicPlaceholders.push(`$${placeholderNum}`)
        }
    }

    const pAfter = numLeadingPlaceholders + allowedPrivateIds.length + 1

    const beforeParams = [timeZone, userId, filterUserId, filterUserId, userId, tag,
        isDiscoverMode, userId, filterUserId, filterUserId]

    const afterParams = [sort, sort, sort, sort, sort, sort,
        pageSize, (page - 1)*pageSize]

    const finalParams = beforeParams.concat(allowedPrivateIds, afterParams)

    return query(`
        select
            p.public_id,
            p.title,
            to_char(
                timezone($1, p.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            u.username,
            u.user_id,
            u.public_id as user_public_id,
            p.link,
            p.num_comments,
            dn.domain_name,
            u.user_id = $2 or u.user_id = $3 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $4) is_visible,
            exists(select
                1
            from
                tfollower
            where
                followee_user_id = u.user_id and
                user_id = $5) is_follow,
            array(
                select
                    t.tag
                from
                    ttag t
                join
                    tposttag pt on pt.tag_id = t.tag_id
                where
                    pt.post_id = p.post_id
            ) as tags
        from
            tpost p
        join
            tuser u on u.user_id = p.user_id
        left join
            tdomainname dn on dn.domain_name_id = p.domain_name_id
        where
            not is_removed and
            exists(
                select
                    1
                from
                    ttag t
                join
                    tposttag pt on pt.tag_id = t.tag_id
                where
                    t.tag = $6 and
                    pt.post_id = p.post_id
            ) and
            ($7 or u.user_id = $8 or u.user_id = $9 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $10)) and
            (array(
                select
                    pg.private_group_id
                from
                    tprivategroup pg
                join
                    ttag t on t.tag = pg.name
                join
                    tposttag pt on pt.tag_id = t.tag_id
                where
                    pt.post_id = p.post_id) <@ Array[${dynamicPlaceholders.join()}]::integer[])
        order by
            case when $${pAfter} = '' then p.created_on end desc,

            case when $${pAfter+1} = 'oldest' then p.created_on end asc,

            case when $${pAfter+2} = 'comments' then p.num_comments end desc,
            case when $${pAfter+3} = 'comments' then p.created_on end desc,

            case when $${pAfter+4} = 'last' then p.last_comment end desc nulls last,
            case when $${pAfter+5} = 'last' then p.created_on end desc
        limit
            $${pAfter+6}
        offset
            $${pAfter+7}`,
        finalParams
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
            array(
                select
                    t.tag
                from
                    ttag t
                join
                    tposttag pt on pt.tag_id = t.tag_id
                where
                    pt.post_id = p.post_id
            ) as tags,
            array(
                select
                    pg.name
                from
                    tprivategroup pg
                join
                    ttag t on t.tag = pg.name
                join
                    tposttag pt on pt.tag_id = t.tag_id
                where
                    pt.post_id = p.post_id
            ) as private_group_names
        from
            tpost p
        where
            p.public_id = $1`,
        [publicId]
    )
}

exports.getPostWithPublic2 = (publicId, timeZone, userId, filterUserId) => {
    return query(`
        select
            p.post_id,
            p.title,
            to_char(
                timezone($1, p.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            p.created_on created_on_raw,
            p.text_content,
            u.username,
            u.user_id,
            u.public_id as user_public_id,
            p.public_id,
            p.link,
            p.num_comments,
            dn.domain_name,
            u.user_id = $2 or u.user_id = $3 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $4) is_visible,
            exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $5) is_follow,
            array(
                select
                    t.tag
                from
                    ttag t
                join
                    tposttag pt on pt.tag_id = t.tag_id
                where
                    pt.post_id = p.post_id
            ) as tags,
            array(
                select
                    pg.private_group_id
                from
                    tprivategroup pg
                join
                    ttag t on t.tag = pg.name
                join
                    tposttag pt on pt.tag_id = t.tag_id
                where
                    pt.post_id = p.post_id
            ) as private_group_ids
        from
            tpost p
        join
            tuser u on u.user_id = p.user_id
        left join
            tdomainname dn on dn.domain_name_id = p.domain_name_id
        where
            p.public_id = $6 and
            not p.is_removed`,
        [timeZone, userId, filterUserId, filterUserId, userId, publicId]
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

exports.updatePost = (postId, title, textContent, link, domainNameId) => {
    let finalLink = typeof link !== 'undefined' ? link : null
    let finalTextContent = textContent.trim() === '' ? null : textContent

    return query(`
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
                    ttest
                where
                    post_id = p.post_id
            )`,
        [])
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
exports.createPostComment = (postId, userId, content) => {

    /*TODO: figure out how to put this postId in
    the query as a query param, currently
    concat returns type 'text' which the ~
    operator doesn't accept*/
    let lQuery = parseInt(postId) + '.*{1}'

    /*TODO: this might need an SQL transaction*/
    return query(`
        select
            count(1) as count
        from
            ttest
        where
            path ~ $1`,
        [lQuery]).then(res => query(`
        insert into ttest
            (post_id, user_id, text_content, path, public_id)
        values
            ($1, $2, $3, $4, $5)
        returning
            public_id`,
        [postId, userId, content,
            postId + '.' + numToOrderedAlpha(parseInt(res.rows[0].count) + 1),
            nanoid(nanoidAlphabet, nanoidLen)])
    )
}

exports.createCommentComment = (postId, userId, content, parentPath, timeZone) => {
    let lQuery = parentPath + '.*{1}'

    return query(`
        select
            count(1) as count
        from
            ttest
        where
            path ~ $1`,
        [lQuery]).then(res => query(`
        insert into ttest
            (post_id, user_id, text_content, path, public_id)
        values
            ($1, $2, $3, $4, $5)
        returning
            public_id,
            text_content,
            to_char(
                timezone($6, created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on`,
        [postId, userId, content,
            parentPath + '.' + numToOrderedAlpha(parseInt(res.rows[0].count) + 1),
            nanoid(nanoidAlphabet, nanoidLen),
            timeZone])
    )
}

exports.getInboxComments = (timeZone, userId, isDiscoverMode, filterUserId, page) => {
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
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            c.public_id,
            c.is_removed,
            u.user_id = $2 or u.user_id = $3 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $4) is_visible,
            exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $5) is_follow
        from
            ttest c
        join
            tuser u on u.user_id = c.user_id
        join
            tpost p on p.post_id = c.post_id
        where
            (
                (nlevel(c.path) = 2 and p.user_id = $6) or
                (nlevel(c.path) > 2 and (select user_id from ttest where path = subpath(c.path, 0, -1)) = $7)
            ) and
            ($8 or c.user_id = $9 or c.user_id = $10 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = c.user_id and
                    user_id = $11))
        order by
            c.created_on desc
        limit
            $12
        offset
            $13`,
        [timeZone, userId, filterUserId, filterUserId, userId, userId, userId,
            isDiscoverMode, userId, filterUserId, filterUserId, pageSize, (page - 1)*pageSize])
}

exports.getPostComments = (postId, timeZone, userId, isDiscoverMode, filterUserId, page) => {
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
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            c.created_on created_on_raw,
            c.public_id,
            c.is_removed,
            u.user_id = $2 or u.user_id = $3 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $4) is_visible,
            exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $5) is_follow
        from
            ttest c
        join
            tuser u on u.user_id = c.user_id
        where
            c.path <@ $6 and
            ($7 or not exists(
                select
                    1
                from
                    ttest c2
                where
                    c2.path @> c.path and
                    not exists(select 1 from tfollower where user_id = $8 and followee_user_id = c2.user_id) and
                    c2.user_id != $9 and
                    c2.user_id != $10))
        order by
            c.path
        limit
            $11
        offset
            $12`,
        [timeZone, userId, filterUserId, filterUserId,
        userId, postId, isDiscoverMode, filterUserId,
        userId, filterUserId, limit, offset])
}

// count query for above query
// their two where clauses need to remain identical
exports.getPostNumComments = (postId, userId, isDiscoverMode, filterUserId) => {
    return query(`
        select
            count(1) as count
        from
            ttest c
        where
            c.path <@ $1 and
            ($2 or not exists(
                select
                    1
                from
                    ttest c2
                where
                    c2.path @> c.path and
                    not exists(select 1 from tfollower where user_id = $3 and followee_user_id = c2.user_id) and
                    c2.user_id != $4 and
                    c2.user_id != $5))`,
        [postId, isDiscoverMode, filterUserId,
            userId, filterUserId])
}

//
exports.getCommentComments = (path, timeZone, userId, isDiscoverMode, filterUserId, page) => {
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
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            c.created_on created_on_raw,
            c.public_id,
            u.user_id = $2 or u.user_id = $3 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $4) is_visible,
            exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $5) is_follow
        from
            ttest c
        join
            tuser u on u.user_id = c.user_id
        where
            c.path <@ $6 and
            not (c.path ~ $7) and
            ($8 or not exists(
                select
                    1
                from
                    ttest c2
                where
                    c2.path @> c.path and
                    not exists(select 1 from tfollower where user_id = $9 and followee_user_id = c2.user_id) and
                    c2.user_id != $10 and
                    c2.user_id != $11 and
                    not (c2.path @> $12)))
        order by
            c.path
        limit
            $13
        offset
            $14`,
        [timeZone, userId, filterUserId, filterUserId, userId,
            path, path, isDiscoverMode, filterUserId, userId,
            filterUserId, path, limit, offset])
}

// this is copied from the above query
// it's the "count only" version of the query
// ie. it uses the same "where" as above
// these two where clauses need to stay the same
exports.getCommentNumComments = (path, userId, isDiscoverMode, filterUserId) => {
    return query(`
        select
            count(1) as count
        from
            ttest c
        where
            c.path <@ $1 and
            not (c.path ~ $2) and
            ($3 or not exists(
                select
                    1
                from
                    ttest c2
                where
                    c2.path @> c.path and
                    not exists(select 1 from tfollower where user_id = $4 and followee_user_id = c2.user_id) and
                    c2.user_id != $5 and
                    c2.user_id != $6 and
                    not (c2.path @> $7)))`,
        [path, path, isDiscoverMode, filterUserId, userId,
            filterUserId, path])
}

exports.getCommentWithPublic = (publicId) => {
    return query(`
        select
            c.comment_id,
            c.post_id,
            c.path,
            c.user_id,
            c.text_content,
            array(
                select
                    pg.private_group_id
                from
                    tprivategroup pg
                join
                    ttag t on t.tag = pg.name
                join
                    tposttag pt on pt.tag_id = t.tag_id
                where
                    pt.post_id = c.post_id
            ) as private_group_ids
        from
            ttest c
        where
            c.public_id = $1`,
        [publicId]
    )
}

exports.getCommentWithPublic2 = (publicId, timeZone, userId, filterUserId) => {
    return query(`
        select
            c.text_content,
            to_char(
                timezone($1, c.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            c.created_on created_on_raw,
            c.path,
            c.post_id,
            c.public_id comment_public_id,
            u.username,
            u.user_id,
            u.public_id as user_public_id,
            p.public_id post_public_id,
            u.user_id = $2 or u.user_id = $3 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $4) is_visible,
            exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $5) is_follow,
            array(
                select
                    pg.private_group_id
                from
                    tprivategroup pg
                join
                    ttag t on t.tag = pg.name
                join
                    tposttag pt on pt.tag_id = t.tag_id
                where
                    pt.post_id = p.post_id
            ) as private_group_ids
        from
            ttest c
        join
            tuser u on u.user_id = c.user_id
        join
            tpost p on p.post_id = c.post_id
        where
            not p.is_removed and
            c.public_id = $6`,
        [timeZone, userId, filterUserId, filterUserId, userId, publicId]
    )
}

exports.updateComment = (commentId, textContent) => {
    return query(`
        update
            ttest
        set
            text_content = $1
        where
            comment_id = $2`,
        [textContent, commentId])
}

//follower
exports.addFollower = (userId, followeeUserId) => {
    return query(`
        insert into tfollower
            (user_id, followee_user_id)
        values
            ($1, $2)`,
        [userId, followeeUserId])
}

exports.getUserFollowees = (userId) => {
    return query(`
        select
            u.user_id,
            u.username,
            u.public_id
        from
            tfollower f
        join
            tuser u on u.user_id = f.followee_user_id
        where
            f.user_id = $1
        order by
            lower(u.username)`,
        [userId]
    )
}

exports.getUserFollowee = (userId, followeeUserId) => {
    return query(`
        select
            1
        from
            tfollower f
        where
            f.user_id = $1 and
            f.followee_user_id = $2`,
        [userId, followeeUserId]
    )
}

exports.removeFollower = (userId, followeeUserId) => {
    return query(`
        delete from
            tfollower
        where
            user_id = $1 and
            followee_user_id = $2`,
        [userId, followeeUserId])
}

//tags
exports.createTag = (tagName) => {
    return query(`
        insert into ttag
            (tag)
        values
            (lower($1))
        returning
            tag_id`,
        [tagName])
}

exports.createPostTag = (tagId, postId) => {
    return query(`
        insert into tposttag
            (tag_id, post_id)
        values
            ($1, $2)`,
        [tagId, postId])
}

exports.createPostTags = async (trimTags, postId) => {
    let tagIds = []

    for(let i = 0; i < trimTags.length; ++i) {
        const {rows:tagd} = await module.exports.getTag(trimTags[i])

        if(tagd.length) {
            tagIds.push(tagd[0].tag_id)
        }
        else {
            const {rows:tagInsert} = await module.exports.createTag(trimTags[i])
            tagIds.push(tagInsert[0].tag_id)
        }
    }

    //
    for(let i = 0; i < tagIds.length; ++i) {
        await module.exports.createPostTag(tagIds[i], postId)
    }
}

exports.createPrivateGroup = (groupName, userId) => {
    return query(`
        insert into tprivategroup
            (created_by, name)
        values
            ($1, $2)`,
        [userId, groupName])
}

exports.getPrivateGroupWithName = (groupName) => {
    return query(`
        select
            private_group_id,
            created_by
        from
            tprivategroup
        where
            name = lower($1)`,
        [groupName]
    )
}

exports.getPrivateGroupsWithNames = (groupNames) => {
    const placeholders = []

    for(let i = 1; i <= groupNames.length; ++i) {
        placeholders.push(`$${i}`)
    }

    return query(`
        select
            private_group_id,
            created_by,
            name
        from
            tprivategroup
        where
            name in(${placeholders.join()})`,
        groupNames
    )
}

exports.getUserCreatedPrivateGroups = (userId) => {
    return query(`
        select
            name
        from
            tprivategroup
        where
            created_by = $1
        order by
            name`,
        [userId]
    )
}

exports.getUserMemberPrivateGroups = (userId) => {
    return query(`
        select
            pg.name
        from
            tprivategroup pg
        join
            tgroupmember gm on gm.private_group_id = pg.private_group_id
        where
            gm.user_id = $1
        order by
            pg.name`,
        [userId]
    )
}

exports.getUserAllPrivateGroupIds = (userId) => {
    return query(`
        select
            private_group_id
        from
            tprivategroup
        where
            created_by = $1

        union

        select
            pg.private_group_id
        from
            tprivategroup pg
        join
            tgroupmember gm on gm.private_group_id = pg.private_group_id
        where
            gm.user_id = $2`,
        [userId, userId]
    )
}

exports.isAllowedToViewPost = async (postPrivateIds, userId) => {
    const privateIds = []

    if(userId != -1) {
        const {rows:userPrivateGroups} = await module.exports.getUserAllPrivateGroupIds(userId)

        for(const i in userPrivateGroups) {
            privateIds.push(userPrivateGroups[i].private_group_id)
        }
    }

    //check that the post's IDs are a subset of the user's IDs
    const isAllowed = postPrivateIds.every(v => privateIds.includes(v))

    //
    return isAllowed
}

exports.getTag = (tagName) => {
    return query(`
        select
            tag_id,
            num_posts
        from
            ttag
        where
            tag = lower($1)`,
        [tagName]
    )
}

exports.validatePrivateGroup = async (groupName) => {

    // this function is used to process and validate multiple groups
    // when creating and editing posts, but we can use it for a single
    // group here as well
    const [cleanedGroups, groupErrors] = myMisc.processPostTags(groupName)

    //
    if(groupErrors.length) {
        return groupErrors
    }

    //
    if(!cleanedGroups.length) {
        return [{msg:"Please enter a group name"}]
    }

    //
    const errors = []
    const cleanedGroupName = cleanedGroups[0]

    //
    if(cleanedGroupName.substr(0, 2) != 'p-') {
        errors.push({msg: 'Private group names must start with "p-", e.g. "p-frogs"'})
    }

    //
    if(!errors.length) {
        const {rows:pgroup} = await module.exports.getPrivateGroupWithName(cleanedGroupName)

        if(pgroup.length) {
            errors.push({msg: 'This private group has already been claimed'})
        }
    }

    //
    if(!errors.length) {
        const {rows:tagd} = await module.exports.getTag(cleanedGroupName)

        if(tagd.length && tagd[0].num_posts > 0) {
            errors.push({msg: 'This group already has public posts'})
        }
    }

    return errors
}

exports.deletePostTags = (postId) => {
    return query(`
        delete from
            tposttag
        where
            post_id = $1`,
        [postId])
}

//private group member
exports.createGroupMember = (groupId, userId) => {
    return query(`
        insert into tgroupmember
            (private_group_id, user_id)
        values
            ($1, $2)`,
        [groupId, userId])
}

exports.getGroupMember = (groupId, userId) => {
    return query(`
        select
            group_member_id
        from
            tgroupmember
        where
            private_group_id = $1 and
            user_id = $2`,
        [groupId, userId]
    )
}

exports.getGroupMembers = (groupId) => {
    return query(`
        select
            u.public_id,
            u.username
        from
            tuser u
        join
            tgroupmember gm on gm.user_id = u.user_id
        where
            gm.private_group_id = $1
        order by
            u.username`,
        [groupId]
    )
}

exports.deleteGroupMember = (privateGroupId, publicUserId) => {
    return query(`
        delete from
            tgroupmember gm
        using
            tuser u
        where
            u.public_id = $1 and
            gm.private_group_id = $2 and
            u.user_id = gm.user_id`,
        [publicUserId, privateGroupId]
    )
}

//network node
exports.createNetworkNode = (nodeUrl) => {
    return query(`
        insert into tnetworknode
            (node_url)
        values
            ($1)`,
        [nodeUrl])
}

exports.getNetworkNodeWithUrl = (nodeUrl) => {
    return query(`
        select
            network_node_id
        from
            tnetworknode
        where
            node_url = $1`,
        [nodeUrl]
    )
}

exports.getAllNetworkNodes = (timeZone) => {
    return query(`
        select
            node_url,
            to_char(
                timezone($1, created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on
        from
            tnetworknode
        order by
            created_on`,
        [timeZone]
    )
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
