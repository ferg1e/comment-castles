function reply(cpid) {

    //
    let commentLi = document.getElementById(cpid)
    let liChildren = commentLi.children
    let numLiChildren = liChildren.length
    let lastChild = liChildren[numLiChildren - 1]
    let isUl = lastChild.tagName == 'UL'

    //
    let cForm = document.createElement('div')
    let cTextarea = document.createElement('textarea')
    let cButton = document.createElement('input')
    cButton.type = 'button'
    cButton.value = 'Send'
    cButton.onclick = function() {
        const comment = cTextarea.value.trim()

        if(comment != '') {
            const xhr = new XMLHttpRequest()

            xhr.open('POST', '/api/v1/comment')
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
            xhr.onload = function() {
                if(xhr.status == 200) {
                    
                    //
                    const data = JSON.parse(xhr.responseText)

                    //
                    const li = document.createElement('li')
                    li.innerHTML = data.text_content

                    const space1 = document.createTextNode(' ')
                    const space2 = document.createTextNode(' ')
                    const space3 = document.createTextNode(' ')

                    const bySpan = document.createElement('span')
                    bySpan.className = 'cuser'
                    bySpan.innerText = '-' + data.by

                    const dateSpan = document.createElement('span')
                    dateSpan.className = 'cdate'
                    dateSpan.innerText = data.created_on

                    const replyLink = document.createElement('a')
                    const replyLinkText = document.createTextNode('reply')
                    replyLink.appendChild(replyLinkText)
                    replyLink.href = "#"
                    replyLink.onclick = function() {
                        console.log('reply:' + data.public_id)
                        return false
                    }

                    //
                    li.appendChild(space1)
                    li.appendChild(bySpan)
                    li.appendChild(space2)
                    li.appendChild(dateSpan)
                    li.appendChild(space3)
                    li.appendChild(replyLink)

                    //
                    if(isUl) {
                        lastChild.appendChild(li)
                    }
                    else {
                        const newUl = document.createElement('ul')
                        newUl.appendChild(li)
                        commentLi.appendChild(newUl)
                    }

                    //
                    commentLi.removeChild(cForm)
                }
                else {
                    alert('error, please try later')
                }
            }

            xhr.send(encodeURI('commentid=' + cpid + '&text_content=' + comment))
        }
    }

    cForm.appendChild(cTextarea)
    cForm.appendChild(cButton)
    
    //
    if(isUl) {
        //console.log('ul exists, insert comment')
        commentLi.insertBefore(cForm, lastChild)
    }
    else {
        //console.log('ul doesnt exist, create ul...')
        commentLi.appendChild(cForm)
    }
}
