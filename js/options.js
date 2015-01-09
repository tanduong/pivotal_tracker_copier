function loadSavedOptions() {
  if (window.localStorage == null) {
    alert("LocalStorage must be enabled for managing options.");
    return;
  }
  var domainName = window.localStorage["domainName"];
  if (domainName) {
    document.getElementById('domain_info').value = domainName;
  }
}

function saveOptions() {
  var domainVal = document.getElementById('domain_info').value;
  if ((domainVal != "") && (domainVal.indexOf('.') == -1)) {
    alert("Does not look like a valid domain - " +
          domainVal + "\nPlease re-enter");
  } else {
    window.localStorage["domainName"] = domainVal;
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('form').addEventListener('click', saveOptions);
  loadSavedOptions();
});
