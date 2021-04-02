//var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_!:,.;]*[-A-Z0-9+&@#\/%=~_])\|\|\|(([^\s]+)\|\|\|){0,1}/ig
let text = 'blah blah gg [hello!!]http://test.net/what?x=3 gg []https://www.eee.wet'

const urlRegex = /\[([^\[\]]*)\]((https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;

        text = text.replace(
            urlRegex,
            function(all, label, url) {
                console.log(label)
                const title = (label === '') ? url : label
                return '<a href="' + url + '">' + title + '</a>'
            }
        )

console.log(text)

/*function linkify(text) {
    var urlRegex =/(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_!:,.;]*[-A-Z0-9+&@#\/%=~_])/ig;
    return text.replace(urlRegex, function(url) {
        return '<a href="' + url + '">' + url + '</a>';
    });
}*/
