
const rotateMessageCont = `
    position: absolute;
    width: 0;
    height: 0;
    z-index: 0;
    display: none;
    background-color: transparent;
`;

const unitContainerStyles = `
-webkit-transform: unset;
transform: unset;
position: relative;
height: inherit;
`;

const defaultStyles = `
-webkit-transform: translateY(calc(100% + 560px));
transform: translateY(calc(100% + 560px));
position: absolute;
height: calc(100% - 560px);
`;
const delay = ms => new Promise(res => setTimeout(res, ms));
let unset;

function hideContainer(mainContainer) {
  const hideElement = element => {
    element.style.cssText = rotateMessageCont;
  };
  [mainContainer, ...mainContainer.children].forEach(hideElement);
}

function setScroll() {
  document.querySelector(".viewContainer")?.style.scrollY = "auto";
}

async function setUnitContainer() {
  const container = document.querySelector(".unitSelCont");
  const openedContainer = document.querySelector(".unitSelCont.unitSelOpen");
  const closedContainer = document.querySelector(".unitSelCont.unitSelClosed");

  if (openedContainer && !closedContainer) {
    const computedStyles = window.getComputedStyle(container);
    const unset = computedStyles.getPropertyValue("transform");
    if (unset !== "none") {
      await delay(5);
      container.style.cssText = unitContainerStyles;
    }
  } else if (closedContainer && !openedContainer) {
    try {
      const computedStyles = window.getComputedStyle(closedContainer);
      const unset = computedStyles.getPropertyValue("transform");
      if (unset === "none") {
        container.style.cssText = defaultStyles;
      }
    } catch (error) {
      return;
    }
  }
}

window.addEventListener('load', async () => {
  const mainContainer = document.querySelector(".rotateMessageCont");
  mainContainer && hideContainer(mainContainer);
  setScroll();
});

new MutationObserver(() => {
  const mainContainer = document.querySelector(".rotateMessageCont");
  mainContainer && hideContainer(mainContainer);
  setScroll();
  setUnitContainer();
}).observe(document, { attributes: true, subtree: true, childList: true });