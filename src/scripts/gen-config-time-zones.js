
//
require('dotenv').config()

//
const db = require('../db')

db.getTimeZones().then(({rows:timeZones}) => {
    let out = "exports.timeZones = [\r\n"

    for(let i = 0; i < timeZones.length; ++i) {
        out +=
            '    ' +
            JSON.stringify(timeZones[i])
                .replace('"name"', 'name')
                .replace('"utc_offset"', 'utc_offset')
                .replace('"hours"', 'hours')
                .replace('"minutes"', 'minutes') +
            ',\r\n'
    }

    out += "]\r\n"
    console.log(out)
    process.exit()
})
