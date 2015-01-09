chrome.runtime.onInstalled.addListener(function() {

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([{
      conditions: [
      new chrome.declarativeContent.PageStateMatcher({
          pageUrl: {
            urlMatches: 'https://www.pivotaltracker.com/n/projects/*'
          },
      })],
      actions: [new chrome.declarativeContent.ShowPageAction()]
    }]);
  });
});

function initSetting() {
  localStorage["pr#domainName"] = "stanyangroup.com";
}
