//추가: 1.상태 변경시 알림, 2.업데이트시간알림, 3.새로고침시 ui즉시 업뎃
//4.인터벌간격 커스텀, 5.디자인,

//택배정보 저장은 chrome.storage로 한다
//택배정보 관련 외의 저장은 localStorage로 한다
const milis = 10000; //1000ms = 1sec
let intervalId;
let isIntervaling;
console.log('thisisback' + findCurrentTime());
// false === null -> false 즉, 저장된 값이 없으면 true를 준다
if (localStorage.getItem('intervaling') === null) {
    localStorage.setItem('intervaling', true);
}

const base_url = 'https://apis.tracker.delivery/carriers/';

//배송상태를 알아본다.
function checkParcelInterval(milis) {
    //milis마다 반복한다.
    intervalId = setInterval(function () {
        checkParcel();
    }, milis);
}
if (localStorage.getItem('intervaling') === 'true') {
    checkParcelInterval(milis);
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    //확인 정지 메세지를 받았다면
    if (request.type === 'stopInterval') {
        //clearInterval을 실행한다. //아이콘 모양을 바꾼다.
        localStorage.setItem('intervaling', false);
        clearInterval(intervalId);
    }
    //확인 재개 메세지를 받았다면 || 새로고침 메세지를 받았다면
    else if (request.type === 'startInterval') {
        //checkParcel, 즉 다시 인터벌을 시작한다.
        localStorage.setItem('intervaling', true);
        clearInterval(intervalId);
        checkParcelInterval(milis);
    } else if (request.type === 'reflashParcel') {
        checkParcel(() => {
            console.log('callback1');
            chrome.runtime.sendMessage({
                type: 'updateParcel'
            });
            console.log('callback2');
        });
        console.log('response!');
        sendResponse('response!');
    }
});

function checkParcel(cb) {
    chrome.storage.local.get(null, function (parcels) {
        let allKeys = Object.keys(parcels);
        for (let i = 0; i < allKeys.length; i++) {
            const currentKey = allKeys[i];
            console.log(parcels);
            const checkingParcel = parcels[currentKey];
            fetch(base_url + `${checkingParcel.company}/tracks/${checkingParcel.postNumber}`)
                .then(res => res.json())
                .then(res => {
                    //progresses배열의 마지막 요소
                    const latestProgress = res.progresses[res.progresses.length - 1];
                    if (
                        latestProgress.location.name !== checkingParcel.location ||
                        latestProgress.status.text !== checkingParcel.status
                    ) {
                        const parcelUpdated = {
                            [currentKey]: {
                                company: checkingParcel.company,
                                postNumber: checkingParcel.postNumber,
                                location: latestProgress.location.name,
                                status: latestProgress.status.text
                            }
                            //크롬스토리지에 저장
                        };
                        chrome.storage.local.set(parcelUpdated, function () {
                            //새로운 상태나 장소정보가 저장됬으니 알림 기능을 넣는다.
                            console.log('!new Info!');
                            //앱 아이콘을 클릭하면 자동으로 ui가 갱신되니까 아이콘 클릭시 알림 종료하게 한다.
                        });
                    }
                    if (cb && i === allKeys.length - 1) {
                        //콜백이 있고 마지막 반복문이면
                        cb();
                    }
                });
            console.log(`업데이트함`);
        }
    });
}

function findCurrentTime() {
    //이 함수를 이용해 최근 업데이트 시간을 알리자
    let today = new Date();
    let year = today.getFullYear(); // 년도
    let month = today.getMonth() + 1; // 월
    let date = today.getDate(); // 날짜
    let hours = today.getHours(); // 시
    let minutes = today.getMinutes(); // 분
    let seconds = today.getSeconds(); // 초
    return year + '年' + month + '月' + date + '日' + hours + ':' + minutes + ':' + seconds;
}
// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//     if (request.type == 'addParcel') {
//         addtimer(request.company, request.postNumber);
//     }
//     sendResponse('good');
// });

// // background.js

// // This file has an example of how to make variables accessible to other scripts of the extension.

// // It also shows how to handle short lived messages from other scripts, in this case, from in-content.js

// // Note that not all extensions need of a background.js file, but extensions that need to persist data after a popup has closed may need of it.

// // A sample object that will be exposed further down and used on popup.js
// const sampleBackgroundGlobal = {
//     message: 'This object comes from background.js'
// };

// // Listen to short lived messages from in-content.js
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     // Perform any ther actions depending on the message
//     console.log('background.js - received message from in-content.js:', message);
//     // Respond message
//     sendResponse('👍');
// });

// // Make variables accessible from chrome.extension.getBackgroundPage()
// window.sampleBackgroundGlobal = sampleBackgroundGlobal;

// // // Regex-pattern to check URLs against.
// // // It matches URLs like: http[s]://[...]stackoverflow.com[...]
// // var urlRegex = /^https?:\/\/(?:[^./?#]+\.)?stackoverflow\.com/;

// // // A function to use as callback
// // function doStuffWithDom(domContent) {
// //     console.log('I received the following DOM content:\n' + domContent);
// // }

// // // When the browser-action button is clicked...
// // chrome.browserAction.onClicked.addListener(function (tab) {
// //     // ...check the URL of the active tab against our pattern and...
// //     if (urlRegex.test(tab.url)) {
// //         // ...if it matches, send a message specifying a callback too
// //         chrome.tabs.sendMessage(tab.id, { text: 'report_back' }, doStuffWithDom);
// //     }
// // });
