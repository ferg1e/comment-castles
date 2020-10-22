const argon2 = require('argon2')
const {Pool, types} = require('pg')
const shortid = require('shortid')
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
        .then(hash => query(
            'insert into tuser(username, password) values($1, $2)',
            [username, hash]))
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
            eyes
        from
            tuser
        where
            lower(username) = lower($1)`,
        [username]
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
            username`,
        []
    )
}

exports.getUserWithUserId = (userId) => {
    return query(`
        select
            username
        from
            tuser
        where
            user_id = $1`,
        [userId]
    )
}

exports.updateUser = (userId, timeZoneName, postMode, eyes) => {
    return query(`
        update
            tuser
        set
            time_zone = $1,
            post_mode = $2,
            eyes = $3
        where
            user_id = $4`,
        [timeZoneName, postMode, eyes, userId])
}

//group
exports.createGroup = (userId, formData) => {
    return query(
        `insert into tgroup
            (created_by, owned_by, name, group_viewing_mode, group_posting_mode, group_commenting_mode)
        values
            ($1, $2, $3, $4, $5, $6)`,
        [userId, userId, formData.name,
        formData.group_view_mode, formData.group_post_mode, formData.group_comment_mode]
    )
}

exports.getGroupWithName = (name) => {
    return query(`
        select
            g.group_id,
            g.owned_by,
            g.name,
            g.group_viewing_mode,
            g.group_posting_mode,
            g.group_commenting_mode,
            (
                select
                    coalesce(array_agg(user_id), '{}')
                from
                    tmember
                where
                    group_id = g.group_id) members
        from
            tgroup g
        where
            lower(g.name) = lower($1)`,
        [name]
    )
}

exports.getGroups = () => {
    return query(
        'select name from tgroup order by name'
    )
}

exports.updateGroupSettings = (groupId, postMode, commentMode) => {
    return query(`
        update
            tgroup
        set
            group_posting_mode = $1,
            group_commenting_mode = $2
        where
            group_id = $3`,
        [postMode, commentMode, groupId])
}

//post
exports.createPost = (userId, title, textContent, link) => {
    let newPostId = nanoid(nanoidAlphabet, nanoidLen)
    let finalLink = typeof link !== 'undefined' ? link : null
    let finalTextContent = textContent.trim() === '' ? null : textContent

    let promise = query(`
        insert into tpost
            (public_id, user_id, title, text_content, link)
        values
            ($1, $2, $3, $4, $5)
        returning
            post_id`,
        [newPostId, userId, title, finalTextContent, finalLink]
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
            u.username,
            u.user_id,
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
            p.link,
            p.num_comments,
            u.user_id = $2 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $3) is_visible,
            exists(select
                1
            from
                tfollower
            where
                followee_user_id = u.user_id and
                user_id = $4) is_follow,
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
                    t.tag = $5 and
                    pt.post_id = p.post_id
            ) and
            ($6 or u.user_id = $7 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $8))
        order by
            p.created_on desc
        limit
            $9
        offset
            $10`,
        [timeZone, userId, filterUserId, userId, tag,
            isDiscoverMode, userId, filterUserId, pageSize, (page - 1)*pageSize]
    )
}

exports.getPostsWithGroupId = (groupId, timeZone) => {
    return query(`
        select
            p.public_id,
            p.title,
            to_char(
                timezone($1, p.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            u.username,
            p.link,
            P.num_comments
        from
            tpost p
        join
            tuser u on u.user_id = p.user_id
        where
            p.group_id = $2 and
            not is_removed
        order by
            p.created_on desc`,
        [timeZone, groupId]
    )
}

exports.getAllUserVisiblePosts = (timeZone, userId, isSuperAdmin, page, before) => {
    return query(`
        select
            p.public_id,
            p.title,
            to_char(
                timezone($1, p.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            u.username,
            p.link,
            P.num_comments,
            g.name as group_name,
            p.num_spam_votes,
            p.text_content,
            p.is_removed,
            exists(select
                    1
                from
                    tspampost
                where
                    post_id = p.post_id and
                    user_id = $2) is_user_post_spam,
            g.owned_by = $3 or exists(select
                    1
                from
                    tmember
                where
                    user_id = $4 and
                    group_id = g.group_id and
                    is_moderator) is_group_moderator
        from
            tpost p
        join
            tuser u on u.user_id = p.user_id
        join
            tgroup g on p.group_id = g.group_id
        where
            (not p.is_removed or extract(epoch from removed_on) > $5) and
            extract(epoch from created_on) < $6 and
            ($7 or
                g.group_viewing_mode = 'anyone' or
                g.owned_by = $8 or
                exists(select
                        1
                    from
                        tmember
                    where
                        user_id = $9 and
                        group_id = g.group_id))
        order by
            p.created_on desc
        limit
            5
        offset
            $10`,
        [timeZone, userId, userId, userId, before, before, isSuperAdmin, userId, userId, (page - 1)*5]
    )
}

//never used this
exports.getAllPosts2 = (timeZone, userId, page, before) => {
    return query(`
        select
            p.public_id,
            p.title,
            to_char(
                timezone($1, p.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            u.username,
            p.link,
            p.num_comments,
            p.num_spam_votes,
            p.text_content,
            p.is_removed,
            exists(select
                    1
                from
                    tspampost
                where
                    post_id = p.post_id and
                    user_id = $2) is_user_post_spam
        from
            tpost p
        join
            tuser u on u.user_id = p.user_id
        where
            (not p.is_removed or extract(epoch from removed_on) > $3) and
            extract(epoch from created_on) < $4
        order by
            p.created_on desc
        limit
            5
        offset
            $5`,
        [timeZone, userId, before, before, (page - 1)*5]
    )
}

exports.canMarkPostRemoved = (userId, postId, groupId) => {
    return query(`
        select
            exists(
                select
                    1
                from
                    tgroup g
                where
                    g.owned_by = $1 and
                    g.group_id = $2
            ) or
            exists(
                select
                    1
                from
                    tmember m
                where
                    m.is_moderator and
                    m.user_id = $3 and
                    m.group_id = $4
            ) can_remove`,
        [userId, groupId, userId, groupId])
}

exports.canMarkPostSpam = (userId, postId, groupId) => {
    return query(`
        select
            exists(
                select
                    1
                from
                    tgroup g2
                where
                    g2.group_id = $1 and
                    g2.group_viewing_mode = 'anyone'
            ) or
            exists(
                select
                    1
                from
                    tgroup g
                where
                    g.owned_by = $2 and
                    g.group_id = $3
            ) or
            exists(
                select
                    1
                from
                    tmember m
                where
                    m.user_id = $4 and
                    m.group_id = $5
            ) can_mark_spam`,
        [groupId, userId, groupId, userId, groupId])
}

exports.getPostWithPublic = (publicId) => {
    return query(`
        select
            p.post_id,
            p.group_id
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
            p.text_content,
            u.username,
            u.user_id,
            p.public_id,
            p.link,
            p.num_comments,
            u.user_id = $2 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $3) is_visible,
            exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $4) is_follow,
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
            p.public_id = $5 and
            not p.is_removed`,
        [timeZone, userId, filterUserId, userId, publicId]
    )
}

exports.getPostWithGroupAndPublic = (groupName, publicId, timeZone) => {
    return query(
        `
        select
            p.post_id,
            p.title,
            to_char(
                timezone($1, p.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            p.text_content,
            u.username,
            p.public_id,
            p.link,
            p.num_comments
        from
            tpost p
        join
            tuser u on u.user_id = p.user_id
        join
            tgroup g on g.group_id = p.group_id
        where
            p.public_id = $2 and
            g.name = $3 and
            not p.is_removed`,
        [timeZone, publicId, groupName]
    )
}

exports.markPostRemoved = (publicId) => {
    return query(`
        update
            tpost
        set
            is_removed = true,
            removed_on = now()
        where
            public_id = $1`,
        [publicId])
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
            ($1, $2, $3, $4, $5)`,
        [postId, userId, content,
            postId + '.' + numToOrderedAlpha(parseInt(res.rows[0].count) + 1),
            nanoid(nanoidAlphabet, nanoidLen)])
    )
}

exports.createCommentComment = (postId, userId, content, parentPath) => {
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
            ($1, $2, $3, $4, $5)`,
        [postId, userId, content,
            parentPath + '.' + numToOrderedAlpha(parseInt(res.rows[0].count) + 1),
            nanoid(nanoidAlphabet, nanoidLen)])
    )
}

exports.getPostComments = (postId, timeZone, userId, isDiscoverMode, filterUserId) => {
    return query(`
        select
            c.text_content,
            c.path,
            u.username,
            u.user_id,
            to_char(
                timezone($1, c.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            c.public_id,
            c.is_removed,
            u.user_id = $2 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $3) is_visible,
            exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $4) is_follow
        from
            ttest c
        join
            tuser u on u.user_id = c.user_id
        where
            c.path <@ $5 and
            ($6 or not exists(
                select
                    1
                from
                    ttest c2
                where
                    c2.path @> c.path and
                    not exists(select 1 from tfollower where user_id = $7 and followee_user_id = c2.user_id) and
                    c2.user_id != $8))
        order by
            c.path`,
        [timeZone, userId, filterUserId, userId, postId, isDiscoverMode, filterUserId, userId])
}

exports.getCommentComments = (path, timeZone, userId, isDiscoverMode, filterUserId) => {
    return query(`
        select
            c.text_content,
            c.path,
            u.username,
            u.user_id,
            to_char(
                timezone($1, c.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            c.public_id,
            u.user_id = $2 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $3) is_visible,
            exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $4) is_follow
        from
            ttest c
        join
            tuser u on u.user_id = c.user_id
        where
            c.path <@ $5 and
            not (c.path ~ $6) and
            ($7 or not exists(
                select
                    1
                from
                    ttest c2
                where
                    c2.path @> c.path and
                    not exists(select 1 from tfollower where user_id = $8 and followee_user_id = c2.user_id) and
                    c2.user_id != $9 and
                    not (c2.path @> $10)))
        order by
            c.path`,
        [timeZone, userId, filterUserId, userId, path, path, isDiscoverMode, filterUserId, userId, path])
}

exports.getCommentWithGroupAndPublics = (groupName, publicPostId, publicCommentId, timeZone) => {
    return query(`
        select
            c.text_content,
            to_char(
                timezone($1, c.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            c.path,
            c.post_id,
            u.username
        from
            ttest c
        join
            tuser u on u.user_id = c.user_id
        join
            tpost p on p.post_id = c.post_id
        join
            tgroup g on g.group_id = p.group_id
        where
            not p.is_removed and
            c.public_id = $2 and
            p.public_id = $3 and
            g.name = $4`,
        [timeZone, publicCommentId, publicPostId, groupName]
    )
}

exports.getCommentsWithGroupId = (groupId, timeZone) => {
    return query(`
        select
            c.text_content,
            to_char(
                timezone($1, c.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            u.username,
            c.public_id
        from
            ttest c
        join
            tuser u on u.user_id = c.user_id
        join
            tpost p on p.post_id = c.post_id
        where
            p.group_id = $2 and
            not c.is_removed
        order by
            c.created_on desc`,
        [timeZone, groupId]
    )
}

exports.getAllUserVisibleComments = (timeZone, userId, isSuperAdmin, page, before) => {
    return query(`
        select
            c.text_content,
            to_char(
                timezone($1, c.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            u.username,
            c.public_id,
            c.num_spam_votes,
            c.is_removed,
            g.name as group_name,
            exists(select
                    1
                from
                    tspamcomment
                where
                    comment_id = c.comment_id and
                    user_id = $2) is_user_comment_spam,
            g.owned_by = $3 or exists(select
                    1
                from
                    tmember
                where
                    user_id = $4 and
                    group_id = g.group_id and
                    is_moderator) is_group_moderator
        from
            ttest c
        join
            tuser u on u.user_id = c.user_id
        join
            tpost p on p.post_id = c.post_id
        join
            tgroup g on g.group_id = p.group_id
        where
            (not c.is_removed or extract(epoch from c.removed_on) > $5) and
            extract(epoch from c.created_on) < $6 and
            ($7 or
                g.group_viewing_mode = 'anyone' or
                g.owned_by = $8 or
                exists(select
                        1
                    from
                        tmember
                    where
                        user_id = $9 and
                        group_id = g.group_id))
        order by
            c.created_on desc
        limit
            5
        offset
            $10`,
        [timeZone, userId, userId, userId, before, before, isSuperAdmin, userId, userId, (page - 1)*5]
    )
}

//never used this
exports.getAllComments2 = (timeZone, userId, page, before) => {
    return query(`
        select
            c.text_content,
            to_char(
                timezone($1, c.created_on),
                'Mon FMDD, YYYY FMHH12:MIam') created_on,
            u.username,
            c.public_id,
            c.num_spam_votes,
            c.is_removed,
            exists(select
                    1
                from
                    tspamcomment
                where
                    comment_id = c.comment_id and
                    user_id = $2) is_user_comment_spam
        from
            ttest c
        join
            tuser u on u.user_id = c.user_id
        join
            tpost p on p.post_id = c.post_id
        where
            (not c.is_removed or extract(epoch from c.removed_on) > $3) and
            extract(epoch from c.created_on) < $4
        order by
            c.created_on desc
        limit
            5
        offset
            $5`,
        [timeZone, userId, before, before, (page - 1)*5]
    )
}

//same as canMarkPostRemoved, but I think they will differ in the future
exports.canMarkCommentRemoved = (userId, commentId, groupId) => {
    return query(`
        select
            exists(
                select
                    1
                from
                    tgroup g
                where
                    g.owned_by = $1 and
                    g.group_id = $2
            ) or
            exists(
                select
                    1
                from
                    tmember m
                where
                    m.is_moderator and
                    m.user_id = $3 and
                    m.group_id = $4
            ) can_remove`,
        [userId, groupId, userId, groupId])
}

// same body as canMarkPostSpam, but will probably change and use commentId
exports.canMarkCommentSpam = (userId, commentId, groupId) => {
    return query(`
        select
            exists(
                select
                    1
                from
                    tgroup g2
                where
                    g2.group_id = $1 and
                    g2.group_viewing_mode = 'anyone'
            ) or
            exists(
                select
                    1
                from
                    tgroup g
                where
                    g.owned_by = $2 and
                    g.group_id = $3
            ) or
            exists(
                select
                    1
                from
                    tmember m
                where
                    m.user_id = $4 and
                    m.group_id = $5
            ) can_mark_spam`,
        [groupId, userId, groupId, userId, groupId])
}

exports.getCommentWithPublic = (publicId) => {
    return query(`
        select
            c.comment_id,
            p.group_id
        from
            ttest c
        join
            tpost p on p.post_id = c.post_id
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
            c.path,
            c.post_id,
            c.public_id comment_public_id,
            u.username,
            u.user_id,
            p.public_id post_public_id,
            u.user_id = $2 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $3) is_visible,
            exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $4) is_follow
        from
            ttest c
        join
            tuser u on u.user_id = c.user_id
        join
            tpost p on p.post_id = c.post_id
        where
            not p.is_removed and
            c.public_id = $5`,
        [timeZone, userId, filterUserId, userId, publicId]
    )
}

exports.markCommentRemoved = (publicId) => {
    return query(`
        update
            ttest
        set
            is_removed = true,
            removed_on = now()
        where
            public_id = $1`,
        [publicId])
}

//member
exports.createMember = (userId, groupId) => {
    return query(`
        insert into tmember
            (user_id, group_id)
        values
            ($1, $2)`,
        [userId, groupId])
}

exports.getGroupMember = (groupId, userId) => {
    return query(`
        select
            m.is_moderator,
            m.is_poster,
            m.is_commenter
        from
            tmember m
        where
            m.user_id = $1 and
            m.group_id = $2`,
        [userId, groupId]
    )
}

exports.getGroupMembers = (groupId) => {
    return query(`
        select
            m.user_id,
            u.username,
            m.is_moderator,
            m.is_poster,
            m.is_commenter
        from
            tmember m
        join
            tuser u on u.user_id = m.user_id
        where
            m.group_id = $1
        order by
            u.username`,
        [groupId]
    )
}

exports.updateMember = (groupId, userId, isModerator, isPoster, isCommenter) => {
    return query(`
        update
            tmember
        set
            is_moderator = $1,
            is_poster = $2,
            is_commenter = $3
        where
            group_id = $4 and
            user_id = $5`,
        [isModerator, isPoster, isCommenter, groupId, userId]
    )
}

exports.deleteMember = (groupId, userId) => {
    return query(`
        delete from
            tmember
        where
            group_id = $1 and
            user_id = $2`,
        [groupId, userId]
    )
}

//spampost
exports.markPostSpam = (userId, postId) => {
    return query(`
        insert into tspampost
            (post_id, user_id)
        values
            (
                (select post_id from tpost where public_id = $1),
                $2)`,
        [postId, userId])
}

//spamcomment
exports.markCommentSpam = (userId, commentId) => {
    return query(`
        insert into tspamcomment
            (comment_id, user_id)
        values
            (
                (select comment_id from ttest where public_id = $1),
                $2)`,
        [commentId, userId])
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
            u.username
        from
            tfollower f
        join
            tuser u on u.user_id = f.followee_user_id
        where
            f.user_id = $1
        order by
            u.username`,
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

exports.getTags = () => {
    return query(`
        select
            tag,
            num_posts
        from
            ttag
        order by
            tag`
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
            name not like 'GMT%'
        order by
            utc_offset, name`
    )
}
