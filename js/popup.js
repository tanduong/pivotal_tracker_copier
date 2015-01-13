var prModule = angular.module('myModule', ['ui.bootstrap', 'ui.ace', 'ui.utils'], ['$compileProvider', function($compileProvider) {
  $compileProvider.directive('compile', function($compile) {
    return function(scope, element, attrs) {
      scope.$watch(
        function(scope) {
          return scope.$eval(attrs.compile);
        },
        function(value) {
          element.html(value);
          $compile(element.contents())(scope);
        }
      );
    };
  });
}]);

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

function formatDate(date) {
  var month = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return month[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
}

function todayString() {
  return formatDate(new Date());
}

function parseDate(dateString) {
  try {
    return dateString && !isNaN(Date.parse(dateString)) ? new Date(Date.parse(dateString)) :  null;
  } catch(exp) {
    return null;
  }
}


prModule.controller('prController', function($scope, $compile, $timeout) {
  this.$scope = $scope;
  var ctrl = this;

  this.template = localStorage["pr#template"] || TEMPLATE;
  this.editorOptions = {
      require: ['ace/ext/language_tools'],
      advanced: {
        showGutter: true,
        enableSnippets: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true
      },
      mode: 'ejs',
      theme: 'tomorrow'
  };

  this.domainName = localStorage["pr#domainName"] || "stanyangroup.com";

  this.works = [];

  this.todos = [];

  this.teamName            = settedValue(localStorage["pr#teamName"])     ? localStorage["pr#teamName"]     : "";
  this.domainName          = settedValue(localStorage["pr#domainName"])   ? localStorage["pr#domainName"]   : "";
  this.placeholder         = settedValue(localStorage["pr#placeholder"])  ? localStorage["pr#placeholder"]  : "";
  this.recipients          = settedValue(localStorage["pr#recipients"])   ? localStorage["pr#recipients"]   : "";
  this.projectName         = settedValue(localStorage["pr#projectName"])  ? localStorage["pr#projectName"]  : "";
  this.emailTo             = settedValue(localStorage["pr#emailTo"])      ? localStorage["pr#emailTo"]      : "";
  this.emailCC             = settedValue(localStorage["pr#emailCC"])      ? localStorage["pr#emailCC"]      : "";
  this.emailBCC            = settedValue(localStorage["pr#emailBCC"])     ? localStorage["pr#emailBCC"]     : "";
  this.currentEmailDomain  = settedValue(localStorage["pr#currentEmailDomain"])   ? localStorage["pr#currentEmailDomain"] : "";
  this.lastUpdateBillCount = settedValue(localStorage["pr#lastUpdateBillCount"])  ? localStorage["pr#lastUpdateBillCount"] : "" || "None";
  this.subject             = '[' + this.projectName + ']' + " Daily Report " + todayString();

  try {
    this.billRecord = JSON.parse(localStorage["pr#billRecord"]);
  } catch(err) {
    this.billRecord = [];
  };

  this.oldWeekBills  = +window.localStorage["weekBills"]  || 0;
  this.oldMonthBills = +window.localStorage["monthBills"] || 0;
  this.tabActivity   = Array.apply(null, Array(7)).map(Boolean);
  this.tabActivity[+localStorage['pr#currentTab']] = true;

  this.computeBills = function(members) {
    return members.map(function(member) { return member.bill; }).reduce(function(state, val) { return state + val; }, 0);
  };

  this.computeWeekBills = function(todayBills) {
    if(this.expiredBillCount()) {
      return (new Date()).getDay() == 1  ? todayBills : this.oldWeekBills  + todayBills;
    } else {
      return this.oldWeekBills;
    }
  }.bind(this);

  this.computeMonthBills = function(todayBills) {
    if(this.expiredBillCount()) {
      return (new Date()).getDate() == 1 ? todayBills : this.oldMonthBills + todayBills;
    } else {
      return this.oldMonthBills;
    }
  }.bind(this);

  this.todayBills = 0;

  $scope.$watch('prCtrl.todayBills', function(todayBills){
    this.weekBills  = this.computeWeekBills(todayBills);
    this.monthBills = this.computeMonthBills(todayBills);
  }.bind(this));

  this.members = [];

  $scope.$watchCollection('prCtrl.members', function(members){
    this.todayBills = this.computeBills(members);
  }.bind(this));

  try {
    this.members = JSON.parse(localStorage["pr#members"]);
  } catch(err) {
    this.members = [];
  };

  var copy = function(elId) {
    selectText(elId);
    document.execCommand('copy');
    document.getSelection().removeAllRanges();
  }

  this.copy = copy;

  this.saveStories = function(){
    localStorage["pr#todos"]    = JSON.stringify(this.todos);
    localStorage["pr#works"]    = JSON.stringify(this.works);
  };

  this.mergeStories = function(){
    this.todos = _.uniq(_.union(this.todos, JSON.parse(localStorage["pr#todos"])), 'url');
    this.works = _.uniq(_.union(this.works, JSON.parse(localStorage["pr#works"])), 'url');
  };

  this.currentTab = localStorage['pr#currentTab'] == undefined ? 'commit' : localStorage['pr#currentTab'];

  this.select = function(tabIdex) {
    localStorage['pr#currentTab'] = tabIdex;
  };

  $scope.$watch('prCtrl.currentTab', function(selectedTab) {
    localStorage['pr#currentTab'] = selectedTab;
  });

  this.saveTemplate = function(){
    localStorage["pr#template"]   = this.template;
  };

  this.resetTemplate = function() {
    this.template = TEMPLATE;
  }

  this.saveTeam = function() {
    localStorage["pr#teamName"]   = this.teamName;
    localStorage["pr#members"]    = JSON.stringify(this.members);
  };

  this.saveBillables = function() {
    var today = todayString();
    _.remove(this.billRecord, function(record) { return record.recordedAt == today; });
    this.lastUpdateBillCount = today;
    this.billRecord.unshift({
      recordedAt: today,
      monthBills: this.monthBills,
      weekBills : this.weekBills
    });
    localStorage["pr#lastUpdateBillCount"]          = today;
    localStorage["pr#billRecord"]                   = JSON.stringify(this.billRecord);
    localStorage["monthBills"] = this.oldMonthBills = this.monthBills;
    localStorage["weekBills"]  = this.oldWeekBills  = this.weekBills;
  };

  this.saveProject = function() {
    localStorage["pr#projectName"]= this.projectName;
    localStorage["pr#recipients"] = this.recipients;
  };

  this.saveMailTo = function() {
    localStorage["pr#emailTo"]    = this.emailTo;
    localStorage["pr#emailCC"]    = this.emailCC;
    localStorage["pr#emailBCC"]   = this.emailBCC;
  };

  this.expiredBillCount = function() {
    if ((new Date()) - new Date(Date.parse(this.lastUpdateBillCount)) < 24 * 60 * 60 * 1000) {
      return false;
    }
    if(this.oldMonthBills + this.todayBills != this.monthBills) return true;
    if(this.oldWeekBills + this.todayBills != this.weekBills)   return true;
    return false;
  };

  this.noStories = function(){
    return !(this.todos && this.todos instanceof Array && this.todos.length > 0);
  };

  this.commitEmail = function(){
    this.saveProject();
    this.saveTeam();
    this.saveMailTo();
    this.saveTemplate();
    if(this.expiredBillCount()){
      this.saveBillables();
    }
  }.bind(this);

  this.copyCompose = function(elId) {
    var options = {
      subject   : this.subject,
      to        : this.emailTo,
      cc        : this.emailCC,
      bcc       : this.emailBCC,
      body      : this.placeholder ? this.placeholder : '',
      domainName: this.domainName
    };
    copy(elId);
    this.commitEmail();
    makeGmailWin(options);
  }.bind(this);

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
    localStorage["pr#currentEmailDomain"] = this.currentEmailDomain;
    this.newUserName = "";
    $('#new-user-name').focus();
  }

  this.deleteMember = function(member) {
    this.members = _.reject(this.members, member);
  }

  chrome.extension.onMessage.addListener(function(request, sender) {
    if (request.msg != "pt_stories") { return; }
    $scope.prCtrl.works       = request.works;
    $scope.prCtrl.todos       = request.todos;
    $scope.prCtrl.safeApply();
  });

  chrome.tabs.executeScript(null, {file: "js/content_script.js"});
});

function humanize(string) {
  return string.replace(/(\w+)/g, function(match) {
    return match.charAt(0).toUpperCase() + match.slice(1);
  });
}

function makeGmailDomainUrl(domainName) {
  var baseGmailUrl = "https://mail.google.com/";
  var gmailUrlSuffix = "mail/?view=cm&fs=1&tf=1";
  var gmailUrl = baseGmailUrl;
  if (domainName) {
    gmailUrl += "a/" + domainName + "/";
  }
  return gmailUrl + gmailUrlSuffix;
}

function settedValue(value){
  return value != undefined && value != 'undefined' && value != '';
}

function makeGmailWin(options) {
  var subject = options.subject;
  var gmailURL = makeGmailDomainUrl(options.domainName);

  if(settedValue(options.subject)){
    gmailURL = gmailURL + "&su="   + encodeURIComponent(options.subject);
  }

  if(settedValue(options.body)){
    gmailURL = "&body=" + encodeURIComponent(options.body);
  }

  if(settedValue(options.to)){
    gmailURL = gmailURL + "&to="   + encodeURIComponent(options.to);
  }

  if(settedValue(options.cc)){
    gmailURL = gmailURL + "&cc="   + encodeURIComponent(options.cc);
  }

  if(settedValue(options.bcc)){
    gmailURL = gmailURL + "&bcc="  + encodeURIComponent(options.bcc);
  }

  chrome.tabs.create({url: gmailURL });
}

function hereDoc(f) {
  return f.toString().
      replace(/^[^\/]+\/\*!?/, '').
      replace(/\*\/[^\/]+$/, '');
}

var TEMPLATE = hereDoc(function() {/*!
<header>Hi {{prCtrl.recipients &&  (prCtrl.recipients | inflector:humanize) || "everyone"}},</header>
<br/>

<article>
  <header> What has the team done since the last call/email regarding this project? </header>
  <section>
    <ul>
      <li ng-repeat='work in prCtrl.works track by work.url'>
        {{work.status}} -
        <a href="{{work.url}}" target="_blank">{{work.name}}</a>
      </li>
    </ul>
  </section>
</article>

<article>
  <header> What will the team do between now and next call/email regarding this project? </header>
  <section>
    <ul>
      <li ng-repeat='todo in prCtrl.todos track by todo.url'>
        <a href="{{todo.url}}" target="_blank">{{todo.name}}</a>
      </li>
    </ul>
  </section>
</article>

<article>
  <header> What impedes the team from performing their work as effectively as possible? </header>
  <section>
    <ul>
      <li>None</li>
    </ul>
  </section>
</article>

<article>
  <header> How much time have we spent today? </header>
  <section>
    <ul>
      <li> <span ng-bind="prCtrl.todayBills"></span> days </li>
    </ul>
  </section>
</article>

<article>
  <header> How much time have we spent this week? </header>
  <section>
    <ul>
      <li> <span ng-bind="prCtrl.weekBills"></span> days </li>
    </ul>
  </section>
</article>

<article>
  <header> How much time have we spent this month? </header>
  <section>
    <ul>
      <li> <span ng-bind="prCtrl.monthBills"></span> days </li>
    </ul>
  </section>
</article>

<article>
  <header> Our team today: </header>
  <section>
    <ul>
      <li ng-repeat='member in prCtrl.members'>
        {{member.name | inflector:humanize}}
        (<a href="mailto:{{member.email}}?Subject={{encodeURIComponent('Re:' + prCtrl.subject)}}" target="_top">{{member.email}}</a>)
        ({{member.bill}} billable day)
      </li>
    </ul>
  </section>
</article>

<p>
  Best regards,
  <br/>
  {{prCtrl.teamName}}.
</p>
*/});
