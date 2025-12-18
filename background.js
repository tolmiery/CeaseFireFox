let activeTime = 30 * 60 * 1000; // Default active time (30 minutes)
let blurredTime = 10 * 60 * 1000; // Default blurred time (10 minutes)
let activeTimerId;
let blurTimerId;
// I would never actually use these times let's be honest
let allowedStartTime = { hour: 9, minute: 0 };  // Default allowed start time (9:00 AM)
let allowedEndTime = { hour: 22, minute: 0 };  // Default allowed end time (10:00 PM)

// Set up the initial active time and blurred time when the extension is installed or updated
browser.runtime.onInstalled.addListener(() => {
  console.log("Extension installed");
  browser.storage.local.get(['activeTime', 'blurredTime'], (data) => {
    if (data.activeTime) {
      activeTime = data.activeTime;
    }
    if (data.blurredTime) {
      blurredTime = data.blurredTime;
    }
    if (data.allowedStartTime) {
      allowedStartTime = parseTimeString(data.allowedStartTime);
    }
    if (data.allowedEndTime) {
      allowedEndTime = parseTimeString(data.allowedEndTime);
    }
    console.log(`Loaded settings - Active Time: ${activeTime / 60000} minutes, Blurred Time: ${blurredTime / 60000} minutes`);
    console.log(`Allowed Hours: ${allowedStartTime.hour}:${allowedStartTime.minute} - ${allowedEndTime.hour}:${allowedEndTime.minute}`);
    startActiveTimer(); // Start the timer as soon as the extension is installed
  });
});

// Helper function to parse time strings into objects with hour and minute properties
function parseTimeString(timeString) {
  const [hour, minute] = timeString.split(':').map(Number);
  return { hour, minute };
}

function blurTabs(blurred) {
  browser.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      browser.tabs.sendMessage(tab.id, { action: blurred ? 'blurText' : 'unblurText' });
    });
  });
}

let checkIntervalId;  // Interval ID for checking if the user is past curfew
function startActiveTimer() {
   console.log(`Allowed Hours: ${allowedStartTime.hour}:${allowedStartTime.minute} - ${allowedEndTime.hour}:${allowedEndTime.minute}`);
  console.log("Starting active timer...");
  // Check immediately if we are within allowed hours and blur if needed
  curfewCheck();
  // Set an interval to check every second if we're outside allowed hours
  checkIntervalId = setInterval(() => {
    console.log("Checking if user is past curfew (active)...");
    curfewCheck();
  }, 1000); 

  // Run the active timer for the full active time
  activeTimerId = setTimeout(() => {
    console.log("Active time finished.");
    blurTabs(true);  // Blur text when active time ends
    startBlurTimer();  // Start the blurred timer after the active time ends
    // Clear the checking interval when the active time ends
    clearInterval(checkIntervalId);
    clearTimeout(activeTimerId);  // Stop the active timer if we are past curfew
  }, activeTime);
}

// Function to check if the user is past curfew when active
function curfewCheck() {
  if (pastCurfew()) {
    console.log("Past curfew. Blurring text...");
    blurTabs(true);  // Blur text if outside allowed hours
  }
  else {
    console.log("Within allowed hours. Unblurring text...");
    blurTabs(false);  // Unblur text if within allowed hours
  }
}


let blurTimeFinished = false;  // Flag to track if blurred time is finished
let curfewPassed = false;      // Flag to track if curfew has passed

function startBlurTimer() {
  console.log("Starting blur timer...");
 console.log(`Allowed Hours: ${allowedStartTime.hour}:${allowedStartTime.minute} - ${allowedEndTime.hour}:${allowedEndTime.minute}`);
  // Set the blur timer to expire after the specified blurred time
  blurTimerId = setTimeout(() => {
    console.log("Blur time finished.");
    blurTimeFinished = true;  // Mark blur time as finished
    checkAndStartActiveTimer();  // Check if both conditions are met to start the active timer, if curfew no go and likewise if blur time not finished
  }, blurredTime);

  // Periodically check if curfew is over 
  checkIntervalId = setInterval(() => {
    console.log("Checking if curfew has passed (blur)...");
    if (!pastCurfew()) {
      console.log("Curfew passed.");
      curfewPassed = true;  // Mark curfew as passed
      checkAndStartActiveTimer();  // Check if both conditions are met to start the active timer
      clearInterval(checkIntervalId);  // Stop checking for curfew
      clearTimeout(blurTimerId);  // Stop the blur timer if curfew passed early
    }
  }, 1000);  // Check every 1 second (adjust if needed)
}

// Check if both conditions are met to start the active timer
function checkAndStartActiveTimer() {
  // Start the active timer only when both conditions are met
  if (blurTimeFinished && curfewPassed) {
    console.log("Both conditions met. Unblurring text and starting active timer...");
    blurTabs(false);  // Unblur the text
    startActiveTimer();  // Start the active timer
    blurTimeFinished = false;  // Reset blur time flag
    curfewPassed = false;
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
  console.log(`Current Time in minutes: ${currentTimeInMinutes}`);
  console.log(`Start Time in minutes: ${startTimeInMinutes}`);
  console.log(`End Time in minutes: ${endTimeInMinutes}`);
  console.log(`Current Time: ${currentHour}:${currentMinute}`);
  console.log(`Start Time: ${allowedStartTime.hour}:${allowedStartTime.minute}`);
  console.log(`End Time: ${allowedEndTime.hour}:${allowedEndTime.minute}`);
  
  // Case 1: Normal range (start < end)
  if (startTimeInMinutes < endTimeInMinutes) {
    console.log("Normal time range.");
    return !(currentTimeInMinutes >= startTimeInMinutes && currentTimeInMinutes < endTimeInMinutes);
  }
  
  // Case 2: Wrap-around range (start > end, crossing midnight)
  console.log("Wrap-around time range.");
  console.log(!(currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes))
  return !(currentTimeInMinutes >= startTimeInMinutes || currentTimeInMinutes < endTimeInMinutes);
}



// Listen for a message from the options page to update the active time and blurred time
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'setTimes') {
    // Update the active time and blurred time
    activeTime = message.activeTime;
    blurredTime = message.blurredTime;
    allowedStartTime = message.allowedStartTime; // Update start time
    allowedEndTime = message.allowedEndTime;     // Update end time

    // Save the updated settings in storage
    browser.storage.local.set({ activeTime, blurredTime, allowedStartTime, allowedEndTime });

    console.log(`Settings updated - Active Time: ${activeTime / 60000} minutes, Blurred Time: ${blurredTime / 60000} minutes`);
    console.log(`Allowed Hours: ${allowedStartTime.hour}:${allowedStartTime.minute} - ${allowedEndTime.hour}:${allowedEndTime.minute}`);

    // Clear existing timers? Maybe.
    //clearTimeout(activeTimerId);
    //clearTimeout(blurTimerId);
    //clearInterval(checkIntervalId);

    // Recheck the allowed hours and reset the timers
    startActiveTimer(); // Restart the active timer with new settings
  }
});
