document.addEventListener('DOMContentLoaded', () => {
  const activeTimeInput = document.getElementById('activeTimeInput');
  const blurredTimeInput = document.getElementById('blurredTimeInput');
  const allowedStartTimeInput = document.getElementById('allowedStartTimeInput');
  const allowedEndTimeInput = document.getElementById('allowedEndTimeInput');
  const saveButton = document.getElementById('saveButton');

  // Load current active time, blurred time, and allowed hours from storage
  chrome.storage.local.get(['activeTime', 'blurredTime', 'allowedStartTime', 'allowedEndTime'], (data) => {
    if (data.activeTime) {
      activeTimeInput.value = data.activeTime / 60000; // Convert milliseconds to minutes
    }
    if (data.blurredTime) {
      blurredTimeInput.value = data.blurredTime / 60000; // Convert milliseconds to minutes
    }
    if (data.allowedStartTime) {
      // Load and parse the allowed start time (format: HH:MM)
      const startTime = data.allowedStartTime;
      allowedStartTimeInput.value = `${String(startTime.hour).padStart(2, '0')}:${String(startTime.minute).padStart(2, '0')}`;
    }
    if (data.allowedEndTime) {
      // Load and parse the allowed end time (format: HH:MM)
      const endTime = data.allowedEndTime;
      allowedEndTimeInput.value = `${String(endTime.hour).padStart(2, '0')}:${String(endTime.minute).padStart(2, '0')}`;
    }
  });

  saveButton.addEventListener('click', () => {
    // Get values from the input fields
    const activeTime = parseInt(activeTimeInput.value) * 60 * 1000; // Convert minutes to milliseconds
    const blurredTime = parseInt(blurredTimeInput.value) * 60 * 1000; 

    // Parse allowed start time and end time from HH:MM format
    const [startHour, startMinute] = allowedStartTimeInput.value.split(":").map(Number);
    const [endHour, endMinute] = allowedEndTimeInput.value.split(":").map(Number);
    console.log(`Start Time: ${startHour}:${startMinute}`);
    console.log(`End Time: ${endHour}:${endMinute}`);
    const allowedStartTime = { hour: startHour, minute: startMinute };  // Store as an object
    const allowedEndTime = { hour: endHour, minute: endMinute };       

    // Save all the settings (active time, blurred time, allowed hours)
    chrome.storage.local.set({
      activeTime: activeTime,
      blurredTime: blurredTime,
      allowedStartTime: allowedStartTime,
      allowedEndTime: allowedEndTime
    }, () => {
      // Notify user that the settings have been saved
      alert('Settings saved!');
      chrome.runtime.sendMessage({
        action: 'setTimes',  // Action to notify background script
        activeTime: activeTime,
        blurredTime: blurredTime,
        allowedStartTime: allowedStartTime,
        allowedEndTime: allowedEndTime
      });
    });
  });
});
