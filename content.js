// blur/unblur all text on the page
function blurText(blurred = false) {
  const elements = document.querySelectorAll('body, body *');
  elements.forEach(element => {
    if (element instanceof HTMLElement) {
      element.style.filter = blurred ? "blur(5px)" : "none";
    }
  });
}

// disable/enable all links and buttons on the page to prevent interaction during break time
function disableLinksAndButtons(disabled = false) {
  // Disable all <a> elements (links)
  const links = document.querySelectorAll('a');
  links.forEach(link => {
    link.style.pointerEvents = disabled ? 'none' : 'auto'; 
  });

  // Disable all <button> elements
  const buttons = document.querySelectorAll('button');
  buttons.forEach(button => {
    button.disabled = disabled; 
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'breakTime') {
    blurText(true);
    disableLinksAndButtons(true);
  } else if (message.action === 'goTime') {
    blurText(false);
    disableLinksAndButtons(false);
  }
});
