let activeTime = 30 * 60 * 1000; // Default active time (30 minutes)
let blurredTime = 10 * 60 * 1000; // Default blurred time (10 minutes)
let activeTimerId;
let blurTimerId;

// Set up the initial active time and blurred time when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  chrome.storage.local.get(['activeTime', 'blurredTime'], (data) => {
    if (data.activeTime) {
      activeTime = data.activeTime;
    }
    if (data.blurredTime) {
      blurredTime = data.blurredTime;
    }
    console.log(`Loaded settings - Active Time: ${activeTime / 60000} minutes, Blurred Time: ${blurredTime / 60000} minutes`);
    startActiveTimer();  // Start the timer as soon as the extension is installed
  });
});

// Start the active timer
function startActiveTimer() {
  console.log("Starting active timer...");
  activeTimerId = setTimeout(() => {
    console.log("Active time finished. Blurring text...");
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'blurText' });
      });
    });
    startBlurTimer();
  }, activeTime);
}

// Start the blurred timer
function startBlurTimer() {
  console.log("Starting blur timer...");
  blurTimerId = setTimeout(() => {
    console.log("Blur time finished. Unblurring text...");
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { action: 'unblurText' });
      });
    });
    startActiveTimer();  // Restart the active timer after blur ends
  }, blurredTime);
}

// Listen for a message from the options page to update the active time and blurred time
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'setTimes') {
    activeTime = message.activeTime;
    blurredTime = message.blurredTime;
    chrome.storage.local.set({ activeTime, blurredTime });
    console.log(`Settings updated - Active Time: ${activeTime / 60000} minutes, Blurred Time: ${blurredTime / 60000} minutes`);
    clearTimeout(activeTimerId);
    clearTimeout(blurTimerId);
    startActiveTimer();
  }
});
