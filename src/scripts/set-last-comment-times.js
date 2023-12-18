
//
require('dotenv').config()

//
const db = require('../db')

db.setLastCommentTimes().then(res => {
    console.log('done')
})
