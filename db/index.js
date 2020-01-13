require('dotenv').config()
const argon2 = require('argon2')
const {Pool} = require('pg')

const pool = new Pool()

function query(query, params) {
    return pool.query(query, params)
}

exports.createUser = (username, password) => {
    return argon2.hash(password)
        .then(hash => query(
            'insert into tuser(username, password) values($1, $2)',
            [username, hash]))
}

exports.getUserWithUsername = (username) => {
    return query(
        'select user_id, password from tuser where username = $1',
        [username]
    )
}
