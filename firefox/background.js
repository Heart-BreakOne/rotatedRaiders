'use strict';

const prefs = {
  'bypass-cache': false,
  'ua-android': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
  'ua-ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/91.0.4472.80 Mobile/15E148 Safari/604.1',
  'ua-kindle': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_3; en-us; Silk/1.0.146.3-Gen4_12000410) AppleWebKit/533.16 (KHTML, like Gecko) Version/5.0 Safari/533.16 Silk-Accelerated=true',
  'mode': 'android',
  'css': ''
};

const observers = {};
const icons = {};

const onBeforeSendHeaders = ({ requestHeaders }) => {
  for (let i = 0; i < requestHeaders.length; i++) {
    if (requestHeaders[i].name.toLowerCase() === 'user-agent') {
      requestHeaders[i].value = prefs['ua-' + prefs.mode];
      return { requestHeaders };
    }
  }
  return {};
};

const onClicked = tab => {
  if (observers[tab.id]) {
    browser.webRequest.onBeforeSendHeaders.removeListener(observers[tab.id]);
  }
  observers[tab.id] = onBeforeSendHeaders;
  browser.webRequest.onBeforeSendHeaders.addListener(observers[tab.id], {
    urls: ['<all_urls>'],
    tabId: tab.id,
    types: ['xmlhttprequest', 'main_frame', 'sub_frame', 'stylesheet', 'script', 'image', 'font', 'object', 'ping', 'csp_report', 'media', 'websocket', 'webtransport', 'webbundle', 'other'],
  }, ['blocking', 'requestHeaders']);
  browser.tabs.reload(tab.id, {
    bypassCache: false
  });
};

browser.storage.onChanged.addListener(changes => {
  Object.entries(changes).forEach(([key, change]) => {
    prefs[key] = change.newValue;
  });
});

browser.storage.local.get(prefs, storedPrefs => {
  Object.assign(prefs, storedPrefs);
  browser.contextMenus.create({
    title: 'Type: Android',
    id: 'android',
    type: 'radio',
    checked: prefs.mode === 'android',
    contexts: ['browser_action']
  });
  browser.contextMenus.create({
    title: 'Type: iOS',
    id: 'ios',
    type: 'radio',
    checked: prefs.mode === 'ios',
    contexts: ['browser_action']
  });
  browser.contextMenus.create({
    title: 'Type: Kindle',
    id: 'kindle',
    type: 'radio',
    checked: prefs.mode === 'kindle',
    contexts: ['browser_action']
  });
  browser.contextMenus.create({
    title: 'Test my User-Agent',
    id: 'test-ua',
    contexts: ['browser_action']
  });
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'test-ua') {
    browser.tabs.create({
      url: 'https://webbrowsertools.com/useragent/?method=normal&verbose=false&r=' + Math.random()
    });
  } else {
    browser.storage.local.set({
      mode: info.menuItemId
    }, () => onClicked(tab));
  }
});

browser.browserAction.onClicked.addListener(onClicked);

const observe = {};
observe.onRemoved = tabId => {
  delete observers[tabId];
  delete icons[tabId];
  observe.check();
};
observe.onCompleted = ({ tabId, frameId }) => {
  if (frameId === 0 && observers[tabId]) {
    browser.webRequest.onBeforeSendHeaders.removeListener(observers[tabId]);
    delete observers[tabId];
    observe.check();
  }
};
observe.onCommitted = ({ tabId, frameId }) => {
  if (frameId === 0 && icons[tabId]) {
    browser.browserAction.setIcon({
      tabId: tabId,
      path: {
        '16': 'data/icons/active/16.png',
        '19': 'data/icons/active/19.png',
        '32': 'data/icons/active/32.png',
        '38': 'data/icons/active/38.png',
        '48': 'data/icons/active/48.png',
        '64': 'data/icons/active/64.png'
      }
    });
    browser.tabs.executeScript(tabId, {
      runAt: 'document_start',
      frameId,
      code: `{
        const script = document.createElement('script');
        script.textContent = \`{
          const o = '${encodeURIComponent(prefs['ua-' + prefs.mode])}';
          navigator.__defineGetter__('userAgent', () => {
            return decodeURIComponent(o);
          });
        }\`;
        document.documentElement.appendChild(script);
        script.remove();
      }`
    }).then(() => browser.runtime.lastError);
    if (prefs.css) {
      browser.tabs.insertCSS(tabId, {
        code: prefs.css,
        runAt: 'document_start'
      });
    }
    delete icons[tabId];
  }
};
observe.install = () => {
  browser.webNavigation.onCommitted.addListener(observe.onCommitted);
  browser.webNavigation.onCompleted.addListener(observe.onCompleted);
  browser.tabs.onRemoved.addListener(observe.onRemoved);
};
observe.remove = () => {
  browser.webNavigation.onCommitted.removeListener(observe.onCommitted);
  browser.webNavigation.onCompleted.removeListener(observe.onCompleted);
  browser.tabs.onRemoved.removeListener(observe.onRemoved);
};
observe.check = () => {
  const len = Object.keys(observers).length;
  if (len) {
    if (!browser.webNavigation.onCompleted.hasListener(observe.onCompleted)) {
      observe.install();
    }
  } else {
    observe.remove();
  }
};