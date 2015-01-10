function openProjectHistory() {
  if($('div.project_history').length == 0) {
    $('label.project_history').click();
    return true;
  }
  return false;
}

function closeProjectHistory() {
  if($('div.project_history').length == 1) {
    $('label.project_history').click();
    return true;
  }
  return false;
}


function getProgress(actions) {
  var priorities = ['delivered', 'finished', 'started'];
  var blackList = ['rejected'];
  for(var i = 0; i < actions.length; i++){
    if(blackList.indexOf(actions[i]) >= 0){
      return null;
    } else if(priorities.indexOf(actions[i]) >= 0) {
      return actions[i];
    }
  }
}

function processActivity(activity) {
  activity = $(activity);
  var activityInfo = {};
  var actions    = activity.find('.box strong').map(function(index, el) {
    return $(el).text();
  });

  activityInfo.storyID    = activity.find('.story').data('id');
  activityInfo.storyName  = activity.find('header.type-feature h1').text();
  activityInfo.projectID  = activity.find('header.type-feature a').data('project-id');
  activityInfo.occuredAt  = new Date($(activity).find('.time_ago').data('millis'));
  activityInfo.progress   = getProgress(actions);
  return activityInfo;
}

function getLatestStories(activityInfo) {
  var res = [];
  var got = [];
  for (var i = 0; i < activityInfo.length; i++) {
    var info = activityInfo[i];

    if (got.indexOf(info.storyID) < 0) {
      res.push(info);
      got.push(info.storyID);
    }
  }
  return res;
}

function getRecentActivities() {
  var activities = $(".item.activity_entry");
  var duration = 12 * 60 * 60 * 1000;

  return activities.filter(function(index, activity){
    var millis = $(activity).find('.time_ago').data('millis');
    var now = new Date();

    if(now - millis < duration) {
      return true;
    } else {
      return false;
    }
  });
}

function extractInfo(activities) {
  return activities.map(function(index, activity){
    return processActivity(activity);
  }).filter(function(index, activityInfo){
    return activityInfo.progress;
  });
}

function humanize(string) {
  return string.replace(/(\w+)/g, function(match) {
    return match.charAt(0).toUpperCase() + match.slice(1);
  });
}

function statusString(status) {
  status = status == 'started' ? 'WIP' : status;
  status = status == 'unstarted' ? '' : status;
  return status ? humanize(status) : '';
}

function storyLink(storyID) {
  return "https://www.pivotaltracker.com/story/show/" + storyID;
}

function formatedData(infos) {
  return infos.map(function(info){
    return {
      status: statusString(info.progress),
      name: info.storyName,
      url: storyLink(info.storyID)
    }
  });
}

function getSelectedStories() {
  var ancs = $("a.selector.selected");
  var stories = $.map(ancs, function(selector) {
    var story = $(selector).closest(".story");
    var id = story.attr("class").match(/story_(\d+)/)[1];
    var link = "https://www.pivotaltracker.com/story/show/" + id;
    var status = (story.attr("class").match(/delivered|finished|started|unstarted/)||[])[0];
    var storyName = story.find("span.story_name").text();

    info = {};
    info.storyID    = id;
    info.storyName  = storyName;
    info.projectID  = null;
    info.occuredAt  = null;
    info.progress   = getProgress([status]);
    return info;
  });


  var res = [];
  var got = [];
  for (var i = 0; i < stories.length; i++) {
    var val = stories[i];

    if (got.indexOf(val.storyID) < 0) {
      res.push(val);
      got.push(val.storyID);
    }
  }
  return res;
}

var works, todos;
+function(){
  var opened = openProjectHistory();
  var works = formatedData(getLatestStories(extractInfo(getRecentActivities())));
  var todos = formatedData(getSelectedStories());
  chrome.extension.sendMessage({msg: "pt_stories", works: works, todos: todos});
  if(opened) {
    closeProjectHistory();
  }
}();
