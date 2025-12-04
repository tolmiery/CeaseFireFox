document.addEventListener('DOMContentLoaded', () => {
  const activeTimeInput = document.getElementById('activeTimeInput');
  const blurredTimeInput = document.getElementById('blurredTimeInput');
  const saveButton = document.getElementById('saveButton');

  // Load current active time and blurred time from storage
  chrome.storage.local.get(['activeTime', 'blurredTime'], (data) => {
    if (data.activeTime) {
      activeTimeInput.value = data.activeTime / 60000; // Convert milliseconds to minutes
    }
    if (data.blurredTime) {
      blurredTimeInput.value = data.blurredTime / 60000; // Convert milliseconds to minutes
    }
  });

  saveButton.addEventListener('click', () => {
    const activeTime = parseInt(activeTimeInput.value) * 60 * 1000; // Convert minutes to milliseconds
    const blurredTime = parseInt(blurredTimeInput.value) * 60 * 1000; // Convert minutes to milliseconds

    chrome.runtime.sendMessage({
      action: 'setTimes',
      activeTime: activeTime,
      blurredTime: blurredTime
    });

    alert('Settings saved!');
  });
});
