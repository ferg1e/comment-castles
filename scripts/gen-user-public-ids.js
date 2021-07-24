
//
require('dotenv').config()

//
const db = require('../db')

//
db.getUsersWithoutPublicId().then(users => {
    for(let i = 0; i < users.rows.length; ++i) {
        const userId = users.rows[i]['user_id']

        db.genUserPublicId(userId).then(x => {
            console.log('gen:' + userId)
        })
    }
})
