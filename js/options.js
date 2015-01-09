function loadSavedOptions() {
  if (window.localStorage == null) {
    alert("LocalStorage must be enabled for managing options.");
    return;
  }
  var domainName = window.localStorage["domainName"];
  if (domainName) {
    document.getElementById('domain_info').value = domainName;
  }
  var subjectPrefix = localStorage["subjectPrefix"];
  if (subjectPrefix) {
    document.getElementById('subject_prefix').value = subjectPrefix;
  }
}

function saveOptions() {
  var domainVal = document.getElementById('domain_info').value;
  console.log("Domain - " + domainVal);
  if ((domainVal != "") && (domainVal.indexOf('.') == -1)) {
    alert("Does not look like a valid domain - " +
          domainVal + "\nPlease re-enter");
  } else {
    window.localStorage["domainName"] = domainVal;
  }
  var subjectPrefix = document.getElementById('subject_prefix').value;
  window.localStorage["subjectPrefix"] = subjectPrefix;
  console.log("Saving Subject Prefix - " + subjectPrefix);
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('form').addEventListener('click', saveOptions);

  loadSavedOptions();
});
