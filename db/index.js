require('dotenv').config()
const argon2 = require('argon2')
const {Pool} = require('pg')

const pool = new Pool()

function query(query, params) {
    return pool.query(query, params)
}

//user
exports.createUser = (username, password) => {
    return argon2.hash(password)
        .then(hash => query(
            'insert into tuser(username, password) values($1, $2)',
            [username, hash]))
}

exports.getUserWithUsername = (username) => {
    return query(
        'select user_id, username, password from tuser where username = $1',
        [username]
    )
}

//group
exports.createGroup = (userId, name) => {
    return query(
        'insert into tgroup(created_by, owned_by, name) values($1, $2, $3)',
        [userId, userId, name]
    )
}

exports.getGroupWithName = (name) => {
    return query(
        'select group_id from tgroup where lower(name) = lower($1)',
        [name]
    )
}

exports.getGroups = () => {
    return query(
        'select name from tgroup order by name'
    )
}
