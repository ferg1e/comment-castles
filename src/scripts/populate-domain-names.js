
//
require('dotenv').config()

//
const myMisc = require('../util/misc.js')
const db = require('../db')

db.getPostLinks().then(async res => {
    for(let i = 0; i < res.rows.length; ++i) {
        const link = res.rows[i]['link']
        const postId = res.rows[i]['post_id']
        const domainName = myMisc.getDomainName(link)
        const domainNameId = await db.getDomainNameId(domainName)

        await db.updatePostDomainNameId(postId, domainNameId)
        console.log([postId, link, domainName, domainNameId])
    }
})
