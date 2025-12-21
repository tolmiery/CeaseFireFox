document.addEventListener('DOMContentLoaded', () => {
  const activeTimeInput = document.getElementById('activeTimeInput');
  const blurredTimeInput = document.getElementById('blurredTimeInput');
  const allowedStartTimeInput = document.getElementById('allowedStartTimeInput');
  const allowedEndTimeInput = document.getElementById('allowedEndTimeInput');
  const saveButton = document.getElementById('saveButton');
  const curfewStatusCheck = document.getElementById('curfewStatusCheck');

  chrome.storage.local.get(['activeTime', 'blurredTime', 'allowedStartTime', 'allowedEndTime', 'curfewStatus'], (data) => {
    if (data.activeTime) {
      activeTimeInput.value = data.activeTime / 60000;
    }
    if (data.blurredTime) {
      blurredTimeInput.value = data.blurredTime / 60000; 
    }
    if (data.allowedStartTime) {
      const startTime = data.allowedStartTime;
      allowedStartTimeInput.value = `${String(startTime.hour).padStart(2, '0')}:${String(startTime.minute).padStart(2, '0')}`;
    }
    if (data.allowedEndTime) {
      const endTime = data.allowedEndTime;
      allowedEndTimeInput.value = `${String(endTime.hour).padStart(2, '0')}:${String(endTime.minute).padStart(2, '0')}`;
    }
    if (data.curfewStatus !== undefined) {
      curfewStatusCheck.checked = data.curfewStatus;
    }
  });

  saveButton.addEventListener('click', () => {
    const activeTime = parseInt(activeTimeInput.value) * 60 * 1000; 
    const blurredTime = parseInt(blurredTimeInput.value) * 60 * 1000; 

    const [startHour, startMinute] = allowedStartTimeInput.value.split(":").map(Number);
    const [endHour, endMinute] = allowedEndTimeInput.value.split(":").map(Number);
    console.log(`Start Time: ${startHour}:${startMinute}`);
    console.log(`End Time: ${endHour}:${endMinute}`);
    const allowedStartTime = { hour: startHour, minute: startMinute }; 
    const allowedEndTime = { hour: endHour, minute: endMinute };   
    const curfewStatus = curfewStatusCheck.checked;    
    console.log('Curfew Status:', curfewStatus);
    chrome.storage.local.set({
      activeTime: activeTime,
      blurredTime: blurredTime,
      allowedStartTime: allowedStartTime,
      allowedEndTime: allowedEndTime,
      curfewStatus: curfewStatus
    }, () => {
      alert('Settings saved!');
      chrome.runtime.sendMessage({
        action: 'setTimes',  
        activeTime: activeTime,
        blurredTime: blurredTime,
        allowedStartTime: allowedStartTime,
        allowedEndTime: allowedEndTime,
        curfewStatus: curfewStatus
      });
    });
  });
});
