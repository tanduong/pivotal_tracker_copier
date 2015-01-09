var prModule = angular.module('myModule', ['ui.bootstrap', 'ui.ace'], ['$compileProvider', function($compileProvider) {
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

prModule.directive('elastic', [
  '$timeout',
  function($timeout) {
    return {
      restrict: 'A',
      link: function($scope, element) {
        var resize = function() {
          return element[0].style.height = "" + element[0].scrollHeight + "px";
        };
        element.on("blur keyup change", resize);
        $timeout(resize, 0);
      }
    };
  }
]);

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



prModule.controller('prController', function($scope, $compile, $timeout) {
  this.template = localStorage["pr#template"] || template;
  this.editorOptions = {
      mode: 'ejs',
      theme: 'chrome'
  };

  this.$scope = $scope;
  this.domainName = localStorage["pr#domainName"] || "stanyangroup.com";

  this.works = [];

  this.todos = [];

  this.teamName   = localStorage["pr#teamName"];
  this.domainName = localStorage["pr#domainName"];
  this.recipients = localStorage["pr#recipients"];
  this.projectName= localStorage["pr#projectName"];
  this.emailTo    = localStorage["pr#emailTo"];
  this.emailCC    = localStorage["pr#emailCC"]  || "quang.huynh@eastagile.com, admin@eastagile.com";
  this.emailBCC   = localStorage["pr#emailBCC"] || "developers@eastagile.com";
  this.subject    = '[' + this.projectName + ']' + " Daily Report " + todayString();

  try {
    this.lastUpdateBillCount = new Date(Date.parse(window.localStorage["lastUpdateBillCount"]));
  } catch(exp) {
    this.lastUpdateBillCount = null;
  }

  this.oldWeekBills  = +window.localStorage["weekBills"]  || 0;
  this.oldMonthBills = +window.localStorage["monthBills"] || 0;

  this.computeBills = function(members) {
    return members.map(function(member) { return member.bill; }).reduce(function(state, val) { return state + val; }, 0);
  };

  this.computeWeekBills = function(todayBills) {
    return (new Date()).getDay() == 1  ? todayBills : this.oldWeekBills  + todayBills;
  }.bind(this);

  this.computeMonthBills = function(todayBills) {
    return (new Date()).getDate() == 1 ? todayBills : this.oldMonthBills + todayBills;
  }.bind(this);

  this.todayBills = 0;

  $scope.$watch('prCtrl.todayBills', function(todayBills){
    debugger;
    this.weekBills  = this.computeWeekBills(todayBills);
    this.monthBills = this.computeMonthBills(todayBills);
  }.bind(this));

  this.members = [];

  $scope.$watchCollection('prCtrl.members', function(members){
    this.todayBills = this.computeBills(members);
  }.bind(this));

  try {
    this.members = JSON.parse(localStorage["pr#members"]);
  }
  catch(err) {
    this.members = [];
  };

  var copy = function(elId) {
    selectText(elId);
    document.execCommand('copy');
    document.getSelection().removeAllRanges();
  }

  this.copy = copy;

  this.saveTemplate = function(){
    localStorage["pr#template"]   = this.template;
  };

  this.saveTeam = function() {
    localStorage["pr#teamName"]   = this.teamName;
    localStorage["pr#members"]    = JSON.stringify(this.members);
    // localStorage["pr#domainName"] = this.domainName;
  };

  this.saveBillables = function() {
      this.lastUpdateBillCount = new Date();
      localStorage["pr#lastUpdateBillCount"] = this.lastUpdateBillCount.toUTCString();
      window.localStorage["monthBills"] = this.oldMonthBills = this.monthBills;
      window.localStorage["weekBills"]  = this.oldWeekBills  = this.weekBills;
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
    if(this.oldMonthBills + this.todayBills != this.monthBills) return true;
    if(this.oldWeekBills + this.todayBills != this.weekBills)   return true;
    return this.lastUpdateBillCount &&(new Date()) - this.lastUpdateBillCount > 12 * 60 * 60 * 1000;
  }

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
      body      : "Paste here",
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
    localStorage["pr#currentEmailDomain"]   = this.currentEmailDomain;
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

function hereDoc(f) {
  return f.toString().
      replace(/^[^\/]+\/\*!?/, '').
      replace(/\*\/[^\/]+$/, '');
}

var template = hereDoc(function() {/*!
<header>Hi {{prCtrl.recipients || "everyone"}},</header>
<br/>

<article>
  <header> What has the team done since the last call/email regarding this project? </header>
  <section>
    <ul>
      <li ng-repeat='work in prCtrl.works'>
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
      <li ng-repeat='todo in prCtrl.todos'>
        <a href="{{todo.url}}" target="_blank">{{todo.name}}</a>
      </li>
    </ul>
  </section>
</article>

<article>
  <header> What impedes the team from performing their work as effectively as possible? </header>
  <section>
    <ul>
      <li> Anythings? </li>
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
        {{member.name}}
        <a href="mailto:{{member.email}}?Subject={{encodeURIComponent('Re:' + prCtrl.subject)}}" target="_top">
          ({{member.email}})
        </a>
        ({{member.bill}} billable day)
      </li>
    </ul>
  </section>
</article>

<p>Best regards,</p>

<p>{{prCtrl.teamName}}</p>
*/});
