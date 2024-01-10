// popup.js
const disneyReg = new RegExp("disneyplus.com\/.*\/video")

document.addEventListener('DOMContentLoaded', function () {
    //restoreOptions();

    // const toggleButton = document.getElementById('checkBox');
    const copyText = document.getElementById("copyInput");
    const submitIdInput = document.getElementById("submitIdInput");

    document.getElementById("copyButton").addEventListener('click', function () {
        navigator.clipboard.writeText(copyText.value);
    })


    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        //if (disneyReg.test(tabs[0].url)){

            document.getElementById("submitButton").addEventListener('click', function () {
                chrome.tabs.sendMessage(tabs[0].id, { submittedId: submitIdInput.value });
            })
        
            chrome.tabs.sendMessage(tabs[0].id,{getPeerId: true}).then((response) => 
            {
                copyText.value = response.peerId;
                console.log("AAAAAAAAAAAAAAAAAAAAAAAA")
            });

            // toggleButton.addEventListener('click', function () {
            //     if (toggleButton.checked)
            //         chrome.tabs.sendMessage(tabs[0].id, {listener: true}).then((response) => {
            //             if (!response.succes)
            //                 toggleButton.checked = false
            //         });
            //     else
            //         chrome.tabs.sendMessage(tabs[0].id, {stopListener: true}).then((response) => {
            //             if (!response.succes)
            //                 toggleButton.checked = true
            //         });
            //
            //     chrome.storage.session.set({checked: toggleButton.checked});
            // })

        //}
    });
        
});

// // Restores checkbox state using the preferences stored in chrome.storage.sync
// function restoreOptions() {
//     // Use default value = false.
//     chrome.storage.session.get({
//         checked: false
//     }, function (items) {
//         let checkbox = document.getElementById('checkBox')
//         checkbox.checked = items.checked;
//
//         chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//             checkbox.disabled = !disneyReg.test(tabs[0].url)
//         });
//     });
// }


