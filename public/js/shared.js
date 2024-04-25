
//
var currCpid = null
var currForm = null

//
function reply(cpid, isTargetLink) {

    // if open and same then remove and nothing else
    if(cpid == currCpid) {
        document.getElementById(currCpid).parentElement.removeChild(currForm)
        currCpid = null
        currForm = null
        return
    }

    // if open and different then remove and then do the rest
    if(currCpid) {
        document.getElementById(currCpid).parentElement.removeChild(currForm)
        currCpid = null
        currForm = null
    }

    //
    let commentLi = document.getElementById(cpid).parentElement
    let liChildren = commentLi.children
    let numLiChildren = liChildren.length
    let lastChild = liChildren[numLiChildren - 1]
    let isUl = lastChild.tagName == 'UL'

    //
    let cForm = document.createElement('div')
    currForm = cForm
    let cTextarea = document.createElement('textarea')
    cTextarea.rows = 10
    cTextarea.cols = 36
    let cButton = document.createElement('input')
    cButton.type = 'button'
    cButton.value = 'Send'
    cButton.onclick = function() {
        const comment = cTextarea.value.trim()

        if(comment != '') {
            const xhr = new XMLHttpRequest()

            xhr.open('POST', '/api/ajax/comment')
            xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded')
            xhr.onload = function() {
                if(xhr.status == 200) {

                    //
                    const data = JSON.parse(xhr.responseText)

                    //
                    const isError = typeof data.by === 'undefined'

                    if(isError) {
                        return
                    }

                    //
                    const li = document.createElement('li')

                    const space1 = document.createTextNode(' ')
                    const space2 = document.createTextNode(' ')
                    const space3 = document.createTextNode(' ')
                    const space4 = document.createTextNode(' ')

                    const bySpan0 = document.createElement('span')
                    bySpan0.innerHTML = 'by'

                    const authorLink = document.createElement('a')
                    const authorLinkText = document.createTextNode(data.by)
                    authorLink.appendChild(authorLinkText)
                    authorLink.href = '/u/' + data.user_public_id

                    const dateSpan = document.createElement('span')
                    dateSpan.innerText = 'on ' + data.created_on

                    const headerElem = document.createElement('div')
                    headerElem.className = 'cheader'
                    headerElem.appendChild(bySpan0)
                    headerElem.appendChild(document.createTextNode(' '))
                    headerElem.appendChild(authorLink)
                    headerElem.appendChild(space1)
                    headerElem.appendChild(dateSpan)

                    const replyLink = document.createElement('a')
                    const replyLinkText = document.createTextNode('reply')
                    replyLink.appendChild(replyLinkText)
                    replyLink.href = "#"
                    replyLink.onclick = function() {
                        reply(data.public_id, isTargetLink)
                        return false
                    }

                    const permalink = document.createElement('a')
                    const permalinkText = document.createTextNode('link')
                    permalink.appendChild(permalinkText)
                    permalink.href = "/c/" + data.public_id

                    const editLink = document.createElement('a')
                    const editLinkText = document.createTextNode('edit')
                    editLink.appendChild(editLinkText)
                    editLink.href = "/c/" + data.public_id + '/edit'

                    const deleteLink = document.createElement('a')
                    const deleteLinkText = document.createTextNode('delete')
                    deleteLink.appendChild(deleteLinkText)
                    deleteLink.href = "/c/" + data.public_id + '/delete'

                    const footerElem = document.createElement('div')
                    footerElem.className = 'clinks'
                    footerElem.appendChild(permalink)
                    footerElem.appendChild(space2)

                    if(isTargetLink) {
                        const targetLink = document.createElement('a')
                        const targetLinkText = document.createTextNode('link#')
                        targetLink.appendChild(targetLinkText)
                        targetLink.href = "#" + data.public_id

                        footerElem.appendChild(targetLink)
                        footerElem.appendChild(document.createTextNode(' '))
                    }

                    footerElem.appendChild(replyLink)
                    footerElem.appendChild(space3)
                    footerElem.appendChild(editLink)
                    footerElem.appendChild(space4)
                    footerElem.appendChild(deleteLink)

                    const contentSpan = document.createElement('span')
                    contentSpan.className = 'cmeat'
                    contentSpan.innerHTML = data.text_content

                    const topContainer = document.createElement('div')
                    topContainer.id = data.public_id

                    //
                    topContainer.appendChild(headerElem)
                    topContainer.appendChild(contentSpan)
                    topContainer.appendChild(footerElem)

                    li.appendChild(topContainer)

                    //
                    if(isUl) {
                        //insert li as first elem of ul
                        lastChild.insertBefore(li, lastChild.children[0])
                    }
                    else {
                        const newUl = document.createElement('ul')
                        newUl.appendChild(li)
                        commentLi.appendChild(newUl)
                    }

                    //
                    commentLi.removeChild(cForm)
                    currCpid = null
                    currForm = null
                    document.location.hash = `#${data.public_id}`

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

    //
    currCpid = cpid
}
