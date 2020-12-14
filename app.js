require('dotenv').config()
const express = require('express')
const path = require('path')
var cookieParser = require('cookie-parser');
const activeRouter = require('./routes/active')
const apiRouter = require('./routes/api')
const uuid = require('uuid/v4')
const session = require('express-session')
const redisStore = require('connect-redis')(session)
const redis = require('redis')

const redisClient = redis.createClient(process.env.REDIS_PORT)
const app = express()
const server = app.listen(process.env.HTTP_PORT)

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
    store: new redisStore({ host: "localhost", port: process.env.REDIS_PORT, client: redisClient })
    })
)

app.use(express.static(path.join(
    __dirname,
    'public')))

app.use(express.urlencoded({extended:false}))
app.use(cookieParser())
app.use('/', activeRouter)
app.use('/api/', apiRouter)

//app.locals.pretty = true
