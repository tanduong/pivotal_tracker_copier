var prModule = angular.module('myModule', ['ui.bootstrap']);

function selectText(containerid) {
  if (document.selection) {
    var range = document.body.createTextRange();
    range.moveToElementText(document.getElementById(containerid));
    range.select();
  } else if (window.getSelection) {
    var range = document.createRange();
    range.selectNode(document.getElementById(containerid));
    window.getSelection().addRange(range);
  }
}

function formatName(userName){
  return userName.split('.').map(function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

prModule.controller('prController', function($scope, $compile) {
  this.$scope = $scope;
  this.domainName = "stanyangroup.com";
  this.subjectPrefix = window.localStorage["subjectPrefix"];


  this.works = [];

  this.todos = [];

  this.members    = JSON.parse(localStorage["pr#members"]) || [];
  this.teamName   = localStorage["pr#teamName"];
  this.domainName = localStorage["pr#domainName"];
  this.recipients = localStorage["pr#recipients"];
  this.projectName= localStorage["pr#projectName"];

  this.emailTo    = localStorage["pr#emailTo"];
  this.emailCC    = localStorage["pr#emailCC"];
  this.emailBCC   = localStorage["pr#emailBCC"];
  this.subject    = "[EA Daily Report] " + this.projectName + " " + (new Date()).toDateString();

  this.todayBills  = function() {
    return this.members.map(function(member) { return member.bill; }).reduce(function(state, val) { return state + val; }, 0);
  };

  this.weekBills   = function() {
    return (new Date()).getDay() == 1  ? this.todayBills() : (window.localStorage["weekBills"] || 0)  + this.todayBills();
  };

  this.monthBills  = function() {
    return (new Date()).getDate() == 1 ? this.todayBills() : (window.localStorage["monthBills"] || 0) + this.todayBills();
  };



  var copy = function() {
    selectText('email-container');
    document.execCommand('copy');
    document.getSelection().removeAllRanges();
  }

  this.copy = copy;

  this.copyCompose = function() {
    var options = {
      subject   : this.subject,
      to        : this.emailTo,
      cc        : this.emailCC,
      bcc       : this.emailBCC,
      body      : "Paste here",
      domainName: this.domainName
    };
    copy();

    localStorage["pr#members"]    = JSON.stringify(this.members);
    localStorage["pr#teamName"]   = this.teamName;
    localStorage["pr#domainName"] = this.domainName;
    localStorage["pr#recipients"] = this.recipients;
    localStorage["pr#projectName"]= this.projectName;

    localStorage["pr#emailTo"]    = this.emailTo;
    localStorage["pr#emailCC"]    = this.emailCC;
    localStorage["pr#emailBCC"]   = this.emailBCC;

    makeGmailWin(options);
  }

  this.safeApply = function(fn) {
    var phase = this.$scope.$root.$$phase;
    if(phase == '$apply' || phase == '$digest') {
      if(fn && (typeof(fn) === 'function')) {
        fn();
      }
    } else {
      this.$scope.$apply(fn);
    }
  }

  this.addMember = function() {
    this.members.push({
      name  : formatName(this.newUserName),
      email : this.newUserName + '@' + this.currentEmailDomain,
      bill  : 1
    });

    this.newUserName = "";
    $('#new-user-name').focus();
  }

  this.deleteMember = function(member) {
    this.members = _.reject(this.members, member);
  }

  chrome.extension.onMessage.addListener(function(request, sender) {
    if (request.msg != "pt_stories") { return; }
    $scope.prCtrl.works = request.works;
    $scope.prCtrl.todos = request.todos;
    $scope.prCtrl.safeApply();
  });

  chrome.tabs.executeScript(null, {file: "js/content_script.js"});
});


function makeGmailDomainUrl(domainName) {
  var baseGmailUrl = "https://mail.google.com/";
  var gmailUrlSuffix = "mail/?view=cm&fs=1&tf=1";
  var gmailUrl = baseGmailUrl;
  if (domainName) {
    gmailUrl += "a/" + domainName + "/";
  }
  return gmailUrl + gmailUrlSuffix;
}

function makeGmailWin(options) {
  var subject = options.subject;
  var gmailURL = makeGmailDomainUrl(options.domainName) +
                 "&su="   + encodeURIComponent(options.subject) +
                 "&body=" + encodeURIComponent(options.body) +
                 "&to="   + encodeURIComponent(options.to) +
                 "&cc="   + encodeURIComponent(options.cc) +
                 "&bcc="  + encodeURIComponent(options.bcc);
  chrome.tabs.create({url: gmailURL });
}
