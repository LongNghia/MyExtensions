/* 
remove extension tab: start with: chrome://
bulk delete
shortcut and notification
undo
 */


//https://stackoverflow.com/questions/20077487/chrome-extension-message-passing-response-not-sent
// https://stackoverflow.com/questions/38561136/chrome-extension-to-change-dom-with-a-button-in-extension-popup
//https://stackoverflow.com/questions/586182/how-to-insert-an-item-into-an-array-at-a-specific-index-javascript


// function setPopupForChromePage(tab) {
//     if (tab.url.startsWith("chrome://")) {
//         chrome.browserAction.setPopup({
//             popup: "../html/not_this_page.html",
//             tabId: 2
//         })
//     }
// }
// queryTab(current = true, setPopupForChromePage)

var db = {
    articles: [],
    icons: {}
}
var articleSample = {
    icon: "../icon/icon-16.png",
    title: "title",
    host: "host",
    url: "url"
}

chrome.storage.local.get(db, function (data) {
    if (data && data.articles) {
        console.log("inital database", data);
        db = data;
    }
})

chrome.storage.onChanged.addListener(function (changes) {
    chrome.storage.local.get(db, function (data) {
        if (data)
            db = data;

    })
});

chrome.extension.onMessage.addListener(function (message, messageSender, sendResponse) {
    if (message.action == "add-all") {
        queryTab(current = false, saveArticles, sendResponse)
    } else if (message.action == "add-current") {
        queryTab(current = true, saveArticles, sendResponse)
    } else if (message.action == "remove") {
        console.log('received remove message');
        let index = parseInt(message.index)
        // console.log(message.index);
        let deletedItem = db.articles.splice(index, 1)
        chrome.storage.local.set(db, function () {
            console.log("removed :" + index, deletedItem[0].title);
            sendResponse({
                removedItem: deletedItem[0]
            })

        })
    }
    return true;
});


function queryTab(current = true, callback, sendResponse) {
    let option = current ? {
        currentWindow: true,
        active: true
    } : {
        currentWindow: true,
    }
    chrome.tabs.query(option, function (tabs) {
        console.log('got  tabs', tabs);
        if (callback) {
            callback(tabs)
        }
        if (sendResponse) {
            let response = [];
            if (current)
                response = [getArticle(tabs[0])]
            else {
                tabs.forEach(tab => {
                    let obj = getArticle(tab)
                    response.push(obj)
                })
            }

            sendResponse(response)
        }
    });
}

function saveArticles(tabs) {
    // console.log(Array.isArray(db.articles));
    if (tabs.length == 1) {
        let obj = getArticle(tabs[0])
        if (obj && !isUrlExist(obj.url)) {

            db.articles.splice(0, 0, obj) //push to head

            chrome.storage.local.set(db, function () {
                console.log("saved ", db)
            });
        }
    }
    if (tabs.length > 1) {
        tabs.forEach(tab => {
            let obj = getArticle(tab)
            if (obj && !isUrlExist(obj.url)) {
                db.articles.splice(0, 0, obj)
            }
        })
        chrome.storage.local.set(db, function () {
            console.log("saved ", db)
        });
    }
}

function getArticle(tab) {
    if (tab) {
        if (!tab.url ||
            tab.url.startsWith("chrome://") ||
            tab.url.startsWith("https://workona.com")
        ) {
            return null;
        }
        let obj = {
            icon: tab.favIconUrl || null,
            title: tab.title || null,
            url: tab.url || null,
            host: new URL(tab.url).origin || null,
        }

        if (!isKeyExist(db.icons, obj.host)) {
            toDataURL(obj.icon, function (dataUrl) {
                db.icons[obj.host] = dataUrl
    
                chrome.storage.local.set(db, function () {
                    console.log("saved new icon", dataUrl)
                });
            })
        }

        console.log(obj);
        return obj
    }
    return null;
}

function isUrlExist(url = "") {
    if (Array.isArray(db.articles)) {
        let length = db.articles.length
        if (length < 1)
            return false
        for (let i = 0; i < length; i++) {
            if (url == db.articles[i].url) {
                return true;
            }
        }
    }
    return false;
}

function isKeyExist(object, key) {
    let keyArray = Object.keys(object)
    for (let i = 0; i < keyArray.length; i++) {
        if (keyArray[i] == key)
            return true
    }
    return false
}
// base64 icon
function toDataURL(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.onload = function () {
        var reader = new FileReader();
        reader.onloadend = function () {
            callback(reader.result);
        }
        reader.readAsDataURL(xhr.response);
    };
    xhr.open('GET', url);
    xhr.responseType = 'blob';
    xhr.send();
}

/*
 Command stuffs 
 */

chrome.commands.onCommand.addListener((command) => {
    if (command == "save-this-tab") {
        queryTab(current = true, saveArticles)
        chrome.browserAction.setIcon({
            path: "../icon/icons8-reading-100-hotkey.png"
        });
        chrome.browserAction.setTitle({
            title: "Added"
        })

        setTimeout(function () {
            chrome.browserAction.setIcon({
                path: "../icon/icons8-reading-100.png"
            });
            chrome.browserAction.setTitle({
                title: "Show articles"
            })
        }, 5000)
    }
})