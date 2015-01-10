function loadSavedOptions() {
  if (localStorage == null) {
    alert("LocalStorage must be enabled for managing options.");
    return;
  }
  var domainName = localStorage["pr#domainName"];
  if (domainName) {
    document.getElementById('domain_info').value = domainName;
  }
  var placeholder = localStorage["pr#placeholder"];
  if (placeholder) {
    document.getElementById('placeholder').value = placeholder;
  }
}

function saveOptions() {
  var domainVal = document.getElementById('domain_info').value;
  if ((domainVal != "") && (domainVal.indexOf('.') == -1)) {
    alert("Does not look like a valid domain - " +
          domainVal + "\nPlease re-enter");
  } else {
    localStorage["pr#domainName"] = domainVal;
  }

  if (domainVal != "") {
    localStorage["pr#placeholder"] = placeholder;
  } else {
    localStorage.removeItem("pr#placeholder");
  }
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('form').addEventListener('click', saveOptions);
  loadSavedOptions();
});
