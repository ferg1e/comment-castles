const express = require('express')
const path = require('path')
const activeRouter = require('./routes/active')
const uuid = require('uuid/v4')
const session = require('express-session')
const redisStore = require('connect-redis')(session)
const redis = require('redis')

const redisClient = redis.createClient()
const app = express()
const server = app.listen(7007)

app.set('view engine', 'pug')
app.set('views', path.join(__dirname, 'views'))

//TODO: do the secret better
//TODO: use more options to ensure cookie/session
//security is good enough
app.use(session({
    genid: req => uuid(),
    name: 'sid03lellie',
    secret: 'secret38lwi9wlxDeiwo',
    resave: false,
    saveUninitialized: false,
    store: new redisStore({ host: "localhost", port: 6379, client: redisClient })
    })
)

app.use(express.static(path.join(
    __dirname,
    'public')))

app.use(express.urlencoded({extended:false}))
app.use('/', activeRouter)

//app.locals.pretty = true
