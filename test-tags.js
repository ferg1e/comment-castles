let rTags = "one,two, three, ff$"
let tags = rTags.split(',')
let trimTags = []

for(let i = 0; i < tags.length; ++i) {
    let trimTag = tags[i].trim()

    if(trimTag !== "") {
        trimTags.push(trimTag)
    }
}

for(let i = 0; i < trimTags.length; ++i) {
    let isMatch = trimTags[i].match(/^[0-9a-zA-Z-]+$/)

    if(isMatch === null) {
        console.log('error: ' + trimTags[i])
        break
    }
}

console.log(tags)
console.log(trimTags)
