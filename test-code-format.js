let mtext = `one
two
\`\`\`pre
\`\`\`pre
blah
blah
\`\`\`
three`

let lines = mtext.split(/\r\n|\r|\n/)
let preOpens = []
let preCloses = []
let isInPre = false

for(let i = 0; i < lines.length; ++i) {

    //
    if(!isInPre && lines[i] === "```pre") {
        preOpens.push(i)
        isInPre = true
    }

    //
    if(isInPre && lines[i] === "```") {
        preCloses.push(i)
        isInPre = false
    }
}

//
let content = ''
isInPre = false

for(let i = 0; i < lines.length; ++i) {
    if(preOpens.indexOf(i) != -1) {
        content += '<pre>'
        isInPre = true
    }
    else if(preCloses.indexOf(i) != -1) {
        content += '</pre>'
        isInPre = false
    }
    else {
        content += lines[i]

        if(i != lines.length - 1) {
            content += isInPre
                ? "\r\n"
                : '<br>'
        }
    }
}

console.log(lines)
console.log(preOpens)
console.log(preCloses)
console.log(content)
