let activeTime = 30 * 60 * 1000; 
let blurredTime = 10 * 60 * 1000; 
let activeTimerId, blurTimerId;
let checkActiveIntervalId, checkBlurredIntervalId;
let allowedStartTime = { hour: 9, minute: 0 };
let allowedEndTime = { hour: 17, minute: 0 };
let curfewStatus = false; 
// blurTimeFinished tracks whether or not it *should* be finished just based on the timer, isBlurTimerRunning tracks if the timer is actually finished or no
let blurTimeFinished = false;
let allowedHours = false;
let isActiveTimerRunning = false;
let isBlurTimerRunning = false;

browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  browser.storage.local.get(['activeTime', 'blurredTime', 'allowedStartTime', 'allowedEndTime', 'curfewStatus'], (data) => {
    if (data.activeTime) activeTime = data.activeTime;
    if (data.blurredTime) blurredTime = data.blurredTime;
    if (data.allowedStartTime) allowedStartTime = data.allowedStartTime;
    if (data.allowedEndTime) allowedEndTime = data.allowedEndTime;
    if (data.curfewStatus !== undefined) curfewStatus = data.curfewStatus;
    console.log(`Loaded settings - Active Time: ${activeTime / 60000} minutes, Blurred Time: ${blurredTime / 60000} minutes`);
    console.log(`Allowed Hours: ${allowedStartTime.hour}:${allowedStartTime.minute} - ${allowedEndTime.hour}:${allowedEndTime.minute}`);
    startActiveTimer();
  });
});

function parseTimeString(timeString) {
  const [hour, minute] = timeString.split(':').map(Number);
  return { hour, minute };
}

function blurTabs(blurred) {
  browser.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      browser.tabs.sendMessage(tab.id, { action: blurred ? 'breakTime' : 'goTime' });
    });
  });
}

function checkLegality(functionName) {
  if (isBlurTimerRunning) {
    console.log(`${functionName}: Blur timer is already running.`);
    return false;
  }

  if (isActiveTimerRunning) {
    console.log(`${functionName}: Active timer is already running.`);
    return false;
  }
}

function startActiveTimer() {
  if (checkLegality('startActiveTimer') === false) return;
  isActiveTimerRunning = true; 
  console.log("Starting active timer...");
  // check immediately to avoid delays, then check every second
  curfewCheck();
  const startActive = Date.now();
  checkActiveIntervalId = setInterval(() => {
    console.log("Checking if user is past curfew (active)...");
    const elapsedActiveTime = (Date.now() - startActive) / 1000;
    console.log(`Elapsed Time: ${elapsedActiveTime} seconds`);
    curfewCheck();
  }, 1000); 

  activeTimerId = setTimeout(() => {
    console.log("Active time finished.");
    blurTabs(true);  
    clearInterval(checkActiveIntervalId);
    clearTimeout(activeTimerId);
    isActiveTimerRunning = false;  
    startBlurTimer(); 
  }, activeTime);
}

function curfewCheck() {
  if (pastCurfew()) {
    console.log("Past curfew during active time, blurring text...");
    blurTabs(true); 
  } else {
    console.log("Within allowed hours during active time. Unblurring text...");
    blurTabs(false); 
  }
}

/*
The basic gist is that blurring always takes precedent over active time, so for either timer, any blurring
condition means that we should be blurred. No restarting the active timer if we have crossed into the
illegal hours zone.
*/
function startBlurTimer() {
  if (checkLegality('startBlurTimer') === false) return;
  console.log("Starting blur timer...");
  isBlurTimerRunning = true; 

  blurTimerId = setTimeout(() => {
    console.log("Blur time finished.");
    blurTimeFinished = true;  
    clearTimeout(blurTimerId);
    checkAndStartActiveTimer();  
  }, blurredTime);

  const startBlurred = Date.now(); 
  checkBlurredIntervalId = setInterval(() => {
    const elapsedBlurTime = (Date.now() - startBlurred) / 1000; 
    console.log(`Elapsed Time: ${elapsedBlurTime} seconds`);
    if (!pastCurfew()) {
      console.log("Allowed hours.");
      allowedHours = true;
      checkAndStartActiveTimer();
    }
  }, 1000); 
}

function checkAndStartActiveTimer() {
  console.log(`Checking conditions to start active timer - blurTimeFinished: ${blurTimeFinished}, allowedHours: ${allowedHours}`);
  if (blurTimeFinished && allowedHours) {
    console.log("Both conditions met. Unblurring text and starting active timer...");
    blurTabs(false);  
    blurTimeFinished = false; 
    allowedHours = false; 
    isBlurTimerRunning = false;  
    clearInterval(checkBlurredIntervalId); 
    startActiveTimer(); 
  } else if (!blurTimeFinished) {
    console.log("Blur time not finished yet. Waiting...");
  } else if (!allowedHours) {
    console.log("Not in allowed hours yet. Waiting...");
  }
}

function pastCurfew() {
  let now = new Date();
  let currentHour = now.getHours();
  let currentMinute = now.getMinutes();

  // Convert start and end times to minutes since midnight for easier comparison
  const currentTimeInMinutes = currentHour * 60 + currentMinute;
  const startTimeInMinutes = allowedStartTime.hour * 60 + allowedStartTime.minute;
  const endTimeInMinutes = allowedEndTime.hour * 60 + allowedEndTime.minute;

  // Case 1: Normal range (start < end)
  if (startTimeInMinutes < endTimeInMinutes) {
    return !(currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes);
  }

  // Case 2: Wrap-around range (start > end, crossing midnight)
  return !(currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes);
}

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'setTimes') {
    if (message.activeTime) activeTime = message.activeTime;
    if (message.blurredTime) blurredTime = message.blurredTime;
    if (message.allowedStartTime) allowedStartTime = message.allowedStartTime;
    if (message.allowedEndTime) allowedEndTime = message.allowedEndTime;
    if (message.curfewStatus !== undefined) curfewStatus = message.curfewStatus;
    browser.storage.local.set({ activeTime, blurredTime, allowedStartTime, allowedEndTime, curfewStatus });

    console.log(`Settings updated - Active Time: ${activeTime / 60000} minutes, Blurred Time: ${blurredTime / 60000} minutes`);
    console.log(`Allowed Hours: ${allowedStartTime.hour}:${allowedStartTime.minute} - ${allowedEndTime.hour}:${allowedEndTime.minute}`);
    console.log(`Curfew Status: ${curfewStatus}`);
    startActiveTimer(); 
  }
});
