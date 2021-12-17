const config = require('../config')
const express = require('express')
const db = require('../db')
const myMisc = require('../misc.js')

// Create router
const router = express.Router({
    mergeParams: true
});

/**
 * Render a single post by it's ID
 * @param {express.Request} req 
 * @param {express.Response} res 
 * @returns {void | express.Response}
 */
const get = async (req, res) => {
    const postPublicId = req.params[0];
    const finalUserId = req.session.user ? req.session.user.user_id : -1;
    const filterUserId = await db.getCurrEyesId(req);

    // Fetch the current post
    const { rows: [row] } = await db.getPostWithPublic2(postPublicId, myMisc.getCurrTimeZone(req), finalUserId, filterUserId);

    // Bail if we didn't get a post back
    if(!row) return res.send('not found');

    // Render an error page if they're not allowed
    const isAllowed = await db.isAllowedToViewPost(row.private_group_ids, finalUserId);
    if (!isAllowed) {
        return res.render('message', {
            html_title: 'Post #' + row.public_id,
            message: "This post is from a private group and you do not have access.",
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        });
    }

    // Get the requested page or fall back to 1
    const requestedPage = Array.isArray(req.query.p) ? req.query.p[0] : req.query.p;
    const page = parseInt(requestedPage?.toString() ?? '1', 10);

    // Check if discover mode is enabled
    const isDiscoverModeEnabled = myMisc.isDiscover(req);

    // Get the comments for this post
    const { rows: comments } = await db.getPostComments(row.post_id, myMisc.getCurrTimeZone(req), finalUserId, isDiscoverModeEnabled, filterUserId, page);

    // Set the title to depending on the user's permissions
    const htmlTitle = row.is_visible ? row.title : 'Post #' + row.public_id;

    // Render the post
    res.render('single-post', {
        html_title: htmlTitle,
        user: req.session.user,
        post: row,
        comments,
        errors: [],
        is_discover_mode: isDiscoverModeEnabled,
        comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
        max_width: myMisc.getCurrSiteMaxWidth(req),
        page
    });
};

const post = async (req, res) => {
    // Bail if the user isn't authenticated
    // @todo: This should be middleware
    if (!req.session.user) return res.send('nope...');

    const postPublicId = req.params[0];
    const finalUserId = req.session.user ? req.session.user.user_id : -1;
    const filterUserId = await db.getCurrEyesId(req);

    const { rows: [ row ] } = await db.getPostWithPublic2(postPublicId, myMisc.getCurrTimeZone(req), finalUserId, filterUserId);

    // Bail if no post was found
    if (!row) return res.send('not found');

    // Render an error page if they're not allowed
    const isAllowed = await db.isAllowedToViewPost(row.private_group_ids, req.session.user.user_id);
    if(!isAllowed) {
        return res.render('message', {
            html_title: 'Post #' + row.public_id,
            message: "This post is from a private group and you do not have access.",
            user: req.session.user,
            max_width: myMisc.getCurrSiteMaxWidth(req)
        });
    }

    // Process the comment
    const [compressedComment, errors] = myMisc.processComment(req.body.text_content);

    // Render an error page if we found any errors in the comment
    if (errors.length > 0) {
        // Get the requested page or fall back to 1
        const requestedPage = Array.isArray(req.query.p) ? req.query.p[0] : req.query.p;
        const page = parseInt(requestedPage?.toString() ?? '1', 10);

        // Check if discover mode is enabled
        const isDiscoverModeEnabled = myMisc.isDiscover(req)

        const { rows: comments } = await db.getPostComments(row.post_id, myMisc.getCurrTimeZone(req), finalUserId, isDiscoverModeEnabled, filterUserId, page);

        // Set the title to depending on the user's permissions
        const htmlTitle = row.is_visible ? row.title : 'Post #' + row.public_id;

        // Render the post
        return res.render('single-post', {
            html_title: htmlTitle,
            user: req.session.user,
            post: row,
            comments,
            errors,
            is_discover_mode: isDiscoverModeEnabled,
            comment_reply_mode: myMisc.getCurrCommentReplyMode(req),
            max_width: myMisc.getCurrSiteMaxWidth(req),
            page
        });
    }

    // Save the comment to the database
    const { rows:data1 } = await db.createPostComment(row.post_id, req.session.user.user_id, compressedComment);

    // Update the amount of comments on this post
    await db.incPostNumComments(row.post_id);

    // Redirect the user to the newly created comment
    const numComments = row.num_comments + 1;
    const pages = Math.ceil(numComments / config.commentsPerPage);
    const redirectUrl = (pages > 1) ? `/p/${postPublicId}?p=${pages}#${data1[0].public_id}` : `/p/${postPublicId}#${data1[0].public_id}`;
    return res.redirect(redirectUrl);
};

// single post
router.get('/', get);
router.post('/', post);

module.exports = router;
