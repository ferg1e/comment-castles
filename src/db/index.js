const argon2 = require('argon2')
const config = require('../config')
const myMisc = require('../util/misc.js')
const {Pool, types} = require('pg')
const nanoid = require('nanoid/generate')
const nanoidAlphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const nanoidLen = 22
const oauthClientIdLen = 32

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
    const {rows} = await argon2.hash(password)
        .then(hash => query(`
            insert into tuser (
                username,
                password,
                public_id,
                time_zone,
                comment_reply_mode,
                post_mode,
                post_layout,
                site_width,
                posts_per_page,
                posts_vertical_spacing,
                one_bg_color,
                two_bg_color,
                main_text_color,
                post_link_color,
                post_link_visited_color,
                group_bg_color,
                group_text_color,
                hidden_color,
                domain_name_color,
                unfollow_bg_color,
                unfollow_line_color,
                unfollow_text_color,
                follow_bg_color,
                follow_line_color,
                follow_text_color,
                main_link_color,
                nav_link_color,
                footer_link_color,
                page_bg_color,
                page_line_color,
                page_text_color,
                high_bg_color,
                high_text_color,
                high_link_color,
                comment_head_color,
                comment_user_color,
                comment_foot_color)
            values
                ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37)
            returning
                user_id,
                username,
                time_zone,
                post_mode,
                post_layout,
                one_bg_color,
                two_bg_color,
                main_text_color,
                post_link_color,
                post_link_visited_color,
                group_bg_color,
                group_text_color,
                hidden_color,
                domain_name_color,
                unfollow_bg_color,
                unfollow_line_color,
                unfollow_text_color,
                follow_bg_color,
                follow_line_color,
                follow_text_color,
                main_link_color,
                nav_link_color,
                footer_link_color,
                page_bg_color,
                page_line_color,
                page_text_color,
                high_bg_color,
                high_text_color,
                high_link_color,
                comment_head_color,
                comment_user_color,
                comment_foot_color,
                posts_per_page,
                posts_vertical_spacing,
                comment_reply_mode,
                site_width`,
            [
                username,
                hash,
                nanoid(nanoidAlphabet, nanoidLen),
                config.defaultTimeZone,
                config.defaultCommentReplyMode,
                config.defaultViewMode,
                config.defaultPostLayout,
                config.defaultSiteWidth,
                config.defaultPostsPerPage,
                config.defaultPostsVerticalSpacing,
                config.defaultOneBgColor,
                config.defaultTwoBgColor,
                config.defaultMainTextColor,
                config.defaultPostLinkColor,
                config.defaultPostLinkVisitedColor,
                config.defaultGroupBgColor,
                config.defaultGroupTextColor,
                config.defaultHiddenColor,
                config.defaultDomainNameColor,
                config.defaultUnfollowBgColor,
                config.defaultUnfollowLineColor,
                config.defaultUnfollowTextColor,
                config.defaultFollowBgColor,
                config.defaultFollowLineColor,
                config.defaultFollowTextColor,
                config.defaultMainLinkColor,
                config.defaultNavLinkColor,
                config.defaultFooterLinkColor,
                config.defaultPageBgColor,
                config.defaultPageLineColor,
                config.defaultPageTextColor,
                config.defaultHighBgColor,
                config.defaultHighTextColor,
                config.defaultHighLinkColor,
                config.defaultCommentHeadColor,
                config.defaultCommentUserColor,
                config.defaultCommentFootColor,
            ]))

    //
    await module.exports.copyAdminsFollowees(rows[0].user_id)

    //
    return rows
}

exports.getUserWithUsername = (username) => {
    return query(`
        select
            user_id,
            public_id,
            username,
            password,
            time_zone,
            post_mode,
            post_layout,
            one_bg_color,
            two_bg_color,
            main_text_color,
            post_link_color,
            post_link_visited_color,
            group_bg_color,
            group_text_color,
            hidden_color,
            domain_name_color,
            unfollow_bg_color,
            unfollow_line_color,
            unfollow_text_color,
            follow_bg_color,
            follow_line_color,
            follow_text_color,
            main_link_color,
            nav_link_color,
            footer_link_color,
            page_bg_color,
            page_line_color,
            page_text_color,
            high_bg_color,
            high_text_color,
            high_link_color,
            comment_head_color,
            comment_user_color,
            comment_foot_color,
            posts_per_page,
            posts_vertical_spacing,
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

exports.updateUser = (userId, timeZoneName, postMode, commentReplyMode, siteWidth, postLayout, postsPerPage, postsVerticalSpacing) => {
    return query(`
        update
            tuser
        set
            time_zone = $1,
            post_mode = $2,
            comment_reply_mode = $3,
            site_width = $4,
            post_layout = $5,
            posts_per_page = $6,
            posts_vertical_spacing = $7
        where
            user_id = $8`,
        [timeZoneName, postMode, commentReplyMode, siteWidth, postLayout, postsPerPage, postsVerticalSpacing, userId])
}

//
exports.updateUserColors = (userId, oneBgColor, twoBgColor, mainTextColor, postLinkColor, postLinkVisitedColor, groupBgColor, groupTextColor, hiddenColor, domainNameColor, unfollowBgColor, unfollowLineColor, unfollowTextColor, followBgColor, followLineColor, followTextColor, mainLinkColor, navLinkColor, footerLinkColor, pageBgColor, pageLineColor, pageTextColor, highBgColor, highTextColor, highLinkColor, commentHeadColor, commentUserColor, commentFootColor) => {
    return query(`
        update
            tuser
        set
            one_bg_color = $1,
            two_bg_color = $2,
            main_text_color = $3,
            post_link_color = $4,
            post_link_visited_color = $5,
            group_bg_color = $6,
            group_text_color = $7,
            hidden_color = $8,
            domain_name_color = $9,
            unfollow_bg_color = $10,
            unfollow_line_color = $11,
            unfollow_text_color = $12,
            follow_bg_color = $13,
            follow_line_color = $14,
            follow_text_color = $15,
            main_link_color = $16,
            nav_link_color = $17,
            footer_link_color = $18,
            page_bg_color = $19,
            page_line_color = $20,
            page_text_color = $21,
            high_bg_color = $22,
            high_text_color = $23,
            high_link_color = $24,
            comment_head_color = $25,
            comment_user_color = $26,
            comment_foot_color = $27
        where
            user_id = $28`,
        [oneBgColor, twoBgColor, mainTextColor, postLinkColor, postLinkVisitedColor, groupBgColor, groupTextColor, hiddenColor, domainNameColor, unfollowBgColor, unfollowLineColor, unfollowTextColor, followBgColor, followLineColor, followTextColor, mainLinkColor, navLinkColor, footerLinkColor, pageBgColor, pageLineColor, pageTextColor, highBgColor, highTextColor, highLinkColor, commentHeadColor, commentUserColor, commentFootColor, userId])
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
            nanoid(nanoidAlphabet, nanoidLen),
            userId
        ])
}

//post
exports.createPost = async (userId, title, textContent, link, trimTags) => {
    const newPublicPostId = nanoid(nanoidAlphabet, nanoidLen)
    const finalLink = link !== '' ? link : null
    const finalTextContent = textContent.trim() === '' ? null : textContent

    //
    let domainNameId = null

    if(link !== '') {
        const domainName = myMisc.getDomainName(link)
        domainNameId = await module.exports.getDomainNameId(domainName)
    }

    //
    const {rows:[row]} = await query(`
        insert into tpost
            (public_id, user_id, title, text_content, link,
            domain_name_id)
        values
            ($1, $2, $3, $4, $5,
            $6)
        returning
            post_id, title, text_content, link, created_on`,
        [newPublicPostId, userId, title, finalTextContent, finalLink,
        domainNameId]
    )

    //
    await module.exports.createPostTags(trimTags, row.post_id)

    //
    return {
        post_id: newPublicPostId,
        title: row.title,
        link: row.link,
        post_text: row.text_content,
        post_time: row.created_on,
        //by: v.username,
        //num_comments: v.num_comments,
        groups: trimTags,
    }
}

exports.getPosts = async (userId, timeZone, page, isDiscoverMode, isLoggedIn, sort, pageSize) => {
    const numLeadingPlaceholders = 6
    const allowedPrivateIds = []
    const dynamicPlaceholders = []

    if(isLoggedIn) {

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

    const beforeParams = [timeZone, userId, userId, isDiscoverMode, userId, userId]

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
            u.user_id = $2 or
                exists(select
                        1
                    from
                        tfollower
                    where
                        followee_user_id = u.user_id and
                        user_id = $3) is_visible,
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
            ($4 or u.user_id = $5 or
                exists(select
                        1
                    from
                        tfollower
                    where
                        followee_user_id = u.user_id and
                        user_id = $6)) and
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
exports.getTagPosts = async (userId, timeZone, page, tag, isDiscoverMode, isLoggedIn, sort, pageSize) => {
    const numLeadingPlaceholders = 7
    const allowedPrivateIds = []
    const dynamicPlaceholders = []

    if(isLoggedIn) {

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

    const beforeParams = [timeZone, userId, userId, tag,
        isDiscoverMode, userId, userId]

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
            u.user_id = $2 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $3) is_visible,
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
                    t.tag = $4 and
                    pt.post_id = p.post_id
            ) and
            ($5 or u.user_id = $6 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $7)) and
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

exports.getPostWithPublic2 = (publicId, timeZone, userId) => {
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
            u.user_id = $2 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $3) is_visible,
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
            p.public_id = $4 and
            not p.is_removed`,
        [timeZone, userId, userId, publicId]
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

exports.updatePost = async (postId, title, textContent, link, trimTags) => {
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

    //delete and recreate tags
    await module.exports.deletePostTags(postId)
    await module.exports.createPostTags(trimTags, postId)
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
}

exports.deleteWholePost = async (postId) => {
    await module.exports.deletePost(postId)
    await module.exports.deletePostComments(postId)
    await module.exports.deletePostTags(postId)
}

//
exports.validateNewPost = async (title, link, group, user_id) => {

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
    let [trimTags, tagErrors] = myMisc.processPostTags(group)
    errors = errors.concat(tagErrors)

    // check private group permissions
    if(!errors.length && trimTags.length) {
        const {rows:privateGroups} = await module.exports.getPrivateGroupsWithNames(trimTags)

        for(let i = 0; i < privateGroups.length; ++i) {
            const pGroup = privateGroups[i]

            if(user_id == pGroup.created_by) {
                continue
            }

            const {rows:gMember} = await module.exports.getGroupMember(
                pGroup.private_group_id,
                user_id)

            if(!gMember.length) {
                errors.push({msg: "You used a private group you don't have access to"})
                break
            }
        }
    }

    //
    return [errors, wsCompressedTitle, trimTags]
}

//
exports.validateEditPost = async (title, link, group, existingPrivateGroups) => {

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
    let [trimTags, tagErrors] = myMisc.processPostTags(group)
    errors = errors.concat(tagErrors)

    // start private group check
    const editedPrivateGroups = []

    if(trimTags.length) {
        const {rows:dataGroups} = await module.exports.getPrivateGroupsWithNames(trimTags)

        for(let i = 0; i < dataGroups.length; ++i) {
            editedPrivateGroups.push(dataGroups[i].name)
        }
    }

    //make sure private groups are unchanged
    //check that the lengths are equal
    //and check that one is a subset of the other
    const isPrivateGroupsSame =
        existingPrivateGroups.length == editedPrivateGroups.length &&
        existingPrivateGroups.every(v => editedPrivateGroups.includes(v))

    if(!isPrivateGroupsSame) {
        errors.push({msg: "You cannot edit private groups"})
    }
    // end private group check

    //
    return [errors, wsCompressedTitle, trimTags]
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
            nanoid(nanoidAlphabet, nanoidLen)])
}

exports.createCommentComment = async (postId, userId, content, parentPath, timeZone) => {
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
                'Mon FMDD, YYYY FMHH12:MIam') created_on`,
        [postId, userId, content,
            parentPath + '.' + myMisc.numToOrderedAlpha(nextPathInt),
            nanoid(nanoidAlphabet, nanoidLen),
            timeZone])
}

exports.getInboxComments = (timeZone, userId, isDiscoverMode, page) => {
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
            u.user_id = $2 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $3) is_visible
        from
            tcomment c
        join
            tuser u on u.user_id = c.user_id
        join
            tpost p on p.post_id = c.post_id
        where
            (
                (nlevel(c.path) = 2 and p.user_id = $4) or
                (nlevel(c.path) > 2 and (select user_id from tcomment where path = subpath(c.path, 0, -1)) = $5)
            ) and
            ($6 or c.user_id = $7 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = c.user_id and
                    user_id = $8))
        order by
            c.created_on desc
        limit
            $9
        offset
            $10`,
        [timeZone, userId, userId, userId, userId,
            isDiscoverMode, userId, userId, pageSize, (page - 1)*pageSize])
}

exports.getPostComments = (postId, timeZone, userId, isDiscoverMode, page) => {
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
            u.user_id = $2 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $3) is_visible
        from
            tcomment c
        join
            tuser u on u.user_id = c.user_id
        where
            c.path <@ $4 and
            ($5 or not exists(
                select
                    1
                from
                    tcomment c2
                where
                    c2.path @> c.path and
                    not exists(select 1 from tfollower where user_id = $6 and followee_user_id = c2.user_id) and
                    c2.user_id != $7))
        order by
            c.path
        limit
            $8
        offset
            $9`,
        [timeZone, userId, userId, postId, isDiscoverMode,
        userId, userId, limit, offset])
}

// count query for above query
// their two where clauses need to remain identical
exports.getPostNumComments = (postId, userId, isDiscoverMode) => {
    return query(`
        select
            count(1) as count
        from
            tcomment c
        where
            c.path <@ $1 and
            ($2 or not exists(
                select
                    1
                from
                    tcomment c2
                where
                    c2.path @> c.path and
                    not exists(select 1 from tfollower where user_id = $3 and followee_user_id = c2.user_id) and
                    c2.user_id != $4))`,
        [postId, isDiscoverMode, userId, userId])
}

//
exports.getCommentComments = (path, timeZone, userId, isDiscoverMode, page) => {
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
            u.user_id = $2 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $3) is_visible
        from
            tcomment c
        join
            tuser u on u.user_id = c.user_id
        where
            c.path <@ $4 and
            not (c.path ~ $5) and
            ($6 or not exists(
                select
                    1
                from
                    tcomment c2
                where
                    c2.path @> c.path and
                    not exists(select 1 from tfollower where user_id = $7 and followee_user_id = c2.user_id) and
                    c2.user_id != $8 and
                    not (c2.path @> $9)))
        order by
            c.path
        limit
            $10
        offset
            $11`,
        [timeZone, userId, userId, path, path, isDiscoverMode, userId,
            userId, path, limit, offset])
}

// this is copied from the above query
// it's the "count only" version of the query
// ie. it uses the same "where" as above
// these two where clauses need to stay the same
exports.getCommentNumComments = (path, userId, isDiscoverMode) => {
    return query(`
        select
            count(1) as count
        from
            tcomment c
        where
            c.path <@ $1 and
            not (c.path ~ $2) and
            ($3 or not exists(
                select
                    1
                from
                    tcomment c2
                where
                    c2.path @> c.path and
                    not exists(select 1 from tfollower where user_id = $4 and followee_user_id = c2.user_id) and
                    c2.user_id != $5 and
                    not (c2.path @> $6)))`,
        [path, path, isDiscoverMode, userId, userId, path])
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
            tcomment c
        where
            c.public_id = $1`,
        [publicId]
    )
}

exports.getCommentWithPublic2 = (publicId, timeZone, userId) => {
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
            u.user_id = $2 or
                exists(select
                    1
                from
                    tfollower
                where
                    followee_user_id = u.user_id and
                    user_id = $3) is_visible,
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
            tcomment c
        join
            tuser u on u.user_id = c.user_id
        join
            tpost p on p.post_id = c.post_id
        where
            not p.is_removed and
            c.public_id = $4`,
        [timeZone, userId, userId, publicId]
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

exports.deletePostComments = (postId) => {
    return query(`
        delete from
            tcomment
        where
            post_id = $1`,
        [postId])
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

//follower
exports.addFollower = (userId, followeeUserId) => {
    return query(`
        insert into tfollower
            (user_id, followee_user_id)
        values
            ($1, $2)`,
        [userId, followeeUserId])
}

// follow users that admin is following
// and also follow admin
exports.copyAdminsFollowees = (userId) => {
    return query(`
        insert into tfollower
            (user_id, followee_user_id)
        (select $1, followee_user_id from tfollower where user_id = $2 and followee_user_id != $3
        union
        select $4::integer, $5::integer)`,
        [
            userId,
            config.adminUserId,
            userId,
            userId,
            config.adminUserId
        ])
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

//
exports.unfollowAll = (userId) => {
    return query(`
        delete from
            tfollower
        where
            user_id = $1`,
        [userId])
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
    const tagIds = []

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

//oauth client
exports.createClient = (appName, redirectUri, userId) => {

    //
    const publicClientId = nanoid(nanoidAlphabet, oauthClientIdLen)

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
            u.time_zone,
            u.post_mode
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
