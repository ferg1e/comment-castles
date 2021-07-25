const argon2 = require('argon2')
const config = require('../config')
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

exports.getPosts = (userId, timeZone, page, isDiscoverMode, filterUserId) => {
    let pageSize = 15

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
        where
            not is_removed and
            ($6 or u.user_id = $7 or u.user_id = $8 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $9))
        order by
            p.created_on desc
        limit
            $10
        offset
            $11`,
        [timeZone, userId, filterUserId, filterUserId, userId, isDiscoverMode,
            userId, filterUserId, filterUserId, pageSize, (page - 1)*pageSize]
    )
}

//TODO: very similar to getPosts(), may want to combine
exports.getTagPosts = (userId, timeZone, page, tag, isDiscoverMode, filterUserId) => {
    let pageSize = 15

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
                    user_id = $10))
        order by
            p.created_on desc
        limit
            $11
        offset
            $12`,
        [timeZone, userId, filterUserId, filterUserId, userId, tag,
            isDiscoverMode, userId, filterUserId, filterUserId, pageSize, (page - 1)*pageSize]
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
            ) as tags
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

exports.updatePost = (postId, title, textContent, link) => {
    let finalLink = typeof link !== 'undefined' ? link : null
    let finalTextContent = textContent.trim() === '' ? null : textContent

    return query(`
        update
            tpost
        set
            title = $1,
            link = $2,
            text_content = $3
        where
            post_id = $4`,
        [title, finalLink, finalTextContent, postId])
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
    const pageSize = 15

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

exports.getPostComments = (postId, timeZone, userId, isDiscoverMode, filterUserId) => {
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
            c.path`,
        [timeZone, userId, filterUserId, filterUserId, userId, postId, isDiscoverMode, filterUserId, userId, filterUserId])
}

exports.getCommentComments = (path, timeZone, userId, isDiscoverMode, filterUserId) => {
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
            c.path`,
        [timeZone, userId, filterUserId, filterUserId, userId, path, path, isDiscoverMode, filterUserId, userId, filterUserId, path])
}

exports.getCommentWithPublic = (publicId) => {
    return query(`
        select
            c.comment_id,
            c.post_id,
            c.path,
            c.user_id,
            c.text_content
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
                    user_id = $5) is_follow
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

exports.getTag = (tagName) => {
    return query(`
        select
            tag_id
        from
            ttag
        where
            tag = lower($1)`,
        [tagName]
    )
}

exports.deletePostTags = (postId) => {
    return query(`
        delete from
            tposttag
        where
            post_id = $1`,
        [postId])
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
