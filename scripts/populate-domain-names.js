
//
require('dotenv').config()

//
const {URL} = require('url');
const db = require('../db')

db.getPostLinks().then(async res => {
    for(let i = 0; i < res.rows.length; ++i) {
        const link = res.rows[i]['link']
        const postId = res.rows[i]['post_id']
        const myUrl = new URL(link)

        // remove leading www.
        const domainName = myUrl.hostname.replace(/^(www\.)/, '')

        db.getDomainName(domainName).then(async res => {
            const isExist = res.rows.length

            if(isExist) {
                console.log('existing domain name')
                await db.updatePostDomainNameId(postId, res.rows[0].domain_name_id)
            }
            else {
                console.log('new domain name')

                const newDomain = await db.createDomainName(domainName)
                await db.updatePostDomainNameId(postId, newDomain.rows[0]['domain_name_id'])
            }
        })
    }
})
