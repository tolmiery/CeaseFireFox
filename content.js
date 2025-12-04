// blur all text on the page
function blurText() {
  const elements = document.querySelectorAll('body, body *');
  elements.forEach(element => {
    if (element instanceof HTMLElement) {
      element.style.filter = "blur(5px)";
    }
  });
}

// unblur all text on the page
function unblurText() {
  const elements = document.querySelectorAll('body, body *');
  elements.forEach(element => {
    if (element instanceof HTMLElement) {
      element.style.filter = "none";
    }
  });
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'blurText') {
    blurText();
  } else if (message.action === 'unblurText') {
    unblurText();
  }
});
