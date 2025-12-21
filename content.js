// this is how we make the internet unusable
function blurText(blurred = false) {
  const elements = document.querySelectorAll('body, body *');
  elements.forEach(element => {
    if (element instanceof HTMLElement) {
      element.style.filter = blurred ? "blur(5px)" : "none";
    }
  });
}

/* 
Disable/enable all interactions on the page during breaks for safety
Would be bad to accidentally click a link you can't read 
*/
function disableEvents(disabled) {
  document.body.style.pointerEvents = disabled ? 'none' : 'auto';
  if (disabled) {
    ['keydown', 'keyup', 'keypress'].forEach(event => 
      document.addEventListener(event, preventDefaultEvent, true)
    );
  } else {
    ['keydown', 'keyup', 'keypress'].forEach(event => 
      document.removeEventListener(event, preventDefaultEvent, true)
    );
  }
}

function preventDefaultEvent(e) {
  e.preventDefault();
  e.stopPropagation();
  return false;  //
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'breakTime') {
    blurText(true);
    disableEvents(true);
  } else if (message.action === 'goTime') {
    blurText(false);
    disableEvents(false);
  }
});
