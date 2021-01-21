const alertElement = document.querySelector('#alert');
const intervalToggleBtn = document.querySelector('#intervalToggle');
const refreshBtn = document.querySelector('#refresh');
const companyList = document.querySelector('#company');

// // Fire scripts after page has loaded
document.addEventListener('DOMContentLoaded', function () {
    //스토리지 기반으로 목록을 불러온다.
    updateFromStorge();
    changeToggleBtn(localStorage.getItem('intervaling'));
    fetch('https://apis.tracker.delivery/carriers')
        .then(res => res.json())
        .then(companies => {
            companies.forEach(company => {
                const option = document.createElement('option');
                option.value = company.id;
                option.innerText = company.name;
                companyList.appendChild(option);
            });
        });
});

//택배 추가 버튼 클릭
document.querySelector('#addParcel').addEventListener('click', function () {
    //addingParcel: storge에 저장할 객체
    const addingCompanyId = document.querySelector('#company').value;
    const addingPostNumber = document.querySelector('#postNumber').value;
    const savingKey = String(addingCompanyId) + String(addingPostNumber);
    const addingParcel = {
        [savingKey]: {
            company: addingCompanyId,
            postNumber: addingPostNumber,
            location: '확인중',
            status: '확인중'
        }
    };
    console.log(addingParcel);
    let allKeys;
    chrome.storage.local.get(null, function (parcels) {
        allKeys = Object.keys(parcels);
        console.log(parcels);
        //이미 저장된 택배정보는 storage에 저장하지 않는다.
        if (-1 !== allKeys.indexOf(savingKey)) {
            alertElement.innerHTML = '이미 있는 소포입니다.';
            return;
        }
        //값을 storage에 저장한다.
        chrome.storage.local.set(addingParcel, function () {
            alertElement.innerHTML = '추가 완료했습니다.';
            //ui 업데이트한다.
            addParcelList(addingParcel[savingKey], savingKey);
        });
    });
});

function updateFromStorge() {
    document.querySelector('#list').innerHTML = null;
    chrome.storage.local.get(null, function (parcels) {
        let allKeys = Object.keys(parcels);
        console.log(allKeys);
        console.log(parcels);
        for (let i = 0; i < allKeys.length; i++) {
            addParcelList(parcels[allKeys[i]], allKeys[i]);
            console.log(parcels[allKeys[i]]);
        }
    });
}

function addParcelList(parcel, key) {
    const div = document.createElement('div');
    const btn = document.createElement('button');
    div.id = key;
    div.innerHTML = `${parcel.company} ${parcel.postNumber} [${parcel.location}] [${parcel.status}]`;
    btn.innerHTML = 'delete';
    btn.addEventListener('click', deleteParcel);
    document.querySelector('#list').appendChild(div).appendChild(btn);
}

function deleteParcel(e) {
    const deletingId = e.target.parentNode.id;
    chrome.storage.local.remove([deletingId], function () {
        alertElement.innerHTML = '삭제 완료';
    });
    updateFromStorge();
}
intervalToggleBtn.addEventListener('click', function () {
    if (localStorage.getItem('intervaling') === 'true') {
        chrome.runtime.sendMessage({
            type: 'stopInterval'
        });
    } else {
        chrome.runtime.sendMessage({
            type: 'startInterval'
        });
    }
});

refreshBtn.addEventListener('click', function () {
    chrome.runtime.sendMessage({
        type: 'reflashParcel'
    });
});

function changeToggleBtn(isIntervaling) {
    if (String(isIntervaling) === 'true') intervalToggleBtn.innerHTML = '몇분마다체크중';
    else intervalToggleBtn.innerHTML = '확인하고 있지 않는중';
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.type === 'updateParcel') {
        updateFromStorge();
    }
});

// chrome.runtime.sendMessage(
//     {
//         type: 'addParcel',
//         company: document.querySelector('#company').value,
//         postNumber: document.querySelector('#postNumber').value
//     },
//     handleBackgroundResponse
// );
//const handleBackgroundResponse = response => console.log('popup.js - Received response:', response);

// // popup.js

// // This file initializes its scripts after the popup has loaded.

// // It shows how to access global variables from background.js.
// //   Note that getViews could be used instead to access other scripts.

// //   A port to the active tab is open to send messages to its in-content.js script.

// // Start the popup script, this could be anything from a simple script to a webapp
// const initPopupScript = () => {
//     // Access the background window object
//     const backgroundWindow = chrome.extension.getBackgroundPage();
//     // Do anything with the exposed variables from background.js
//     console.log(backgroundWindow.sampleBackgroundGlobal);

//     // This port enables a long-lived connection to in-content.js
//     let port = null;

//     // Send messages to the open port
//     const sendPortMessage = message => port.postMessage(message);

//     // Find the current active tab
//     const getTab = () =>
//         new Promise(resolve => {
//             chrome.tabs.query(
//                 {
//                     active: true,
//                     currentWindow: true
//                 },
//                 tabs => resolve(tabs[0])
//             );
//         });

//     // Handle port messages
//     const messageHandler = message => {
//         console.log('popup.js - received message:', message);
//     };

//     // Find the current active tab, then open a port to it
//     getTab().then(tab => {
//         // Connects to tab port to enable communication with inContent.js
//         port = chrome.tabs.connect(tab.id, { name: 'chrome-extension-template' });
//         // Set up the message listener
//         port.onMessage.addListener(messageHandler);
//         // Send a test message to in-content.js
//         sendPortMessage('Message from popup!');
//     });
// };

// // Fire scripts after page has loaded
// document.addEventListener('DOMContentLoaded', initPopupScript);

// //컨텐츠 페이지의 #user 입력된 값이 변경 되었을 '때'
// document.querySelector('#user').addEventListener('change', function () {
//     //컨텐츠 페이지에 몇개의 단어가 등장하는지 계산해주세요.
//     var user = document.querySelector('#user').value;

//     //컨텐츠 페이지를 대상으로 코드를 실행해주세요.
//     chrome.tabs.executeScript(
//         {
//             code: 'document.querySelector("body").innerText'
//         },
//         function (result) {
//             // 위의 코드가 실행된 후에 이 함수를 호출해주세요. 그 때 result에 담아주세요.

//             //이 문서에서 body  태그 아래에 있는 모든 텍스를 가져온다. 그 결과를 bodyText라는 변수에 담는다.
//             var bodyText = result[0];
//             //bodyText의 모든 단어를 추출하고, 그 단어의 숫자를 센다. 그 결과를 bodyNum이라는 변수에 담는다.
//             var bodyNum = bodyText.split(' ').length;
//             //bodyText에서 자신이 알고 있는 단어(the)가 몇번 등장하는지를 알아본다. 그 결과를 myNum이라는 변수에 담는다.
//             var myNum = bodyText.match(new RegExp('\\b(' + user + ')\\b', 'gi')).length;

//             var per = (myNum / bodyNum) * 100;
//             per = per.toFixed(1);
//             // id값이 result인 태그에 결과를 추가한다.
//             document.querySelector('#result').innerText = myNum + '/' + bodyNum + '(' + per + '%)';
//         }
//     );
// });
