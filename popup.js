function renderOne(story) {
  return "<li> " + statusString(story.status) + "<a href='" + story.link + "'>" + story.story_name + "</a>" + "</li>";
};

function humanize(string) {
  return string.replace(/(\w+)/g, function(match) {
    return match.charAt(0).toUpperCase() + match.slice(1);
  });
}

function statusString(status) {
  status = status == 'started' ? 'WIP' : status;
  status = status == 'unstarted' ? '' : status;
  return status ? humanize(status) + ' - ' : '';
}

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

$(document).ready(function() {
  // var templateSingle = "<li> <%= status %> - <a href='<%= link %>'> <%= story_name %></li>";
  // var compiled = _.template(templateSingle);
  chrome.extension.onMessage.addListener(function(request, sender) {
    if (request.msg == "stories" && request.stories.length > 0) {
      var html = '';

      _.each(request.stories, function(story) {
        html += renderOne(story);
      });

      html = html == '' ? html : "Please select some stories."

      html = '<ul>' + html + '</ul>';

      $('body').html(html);

      selectText('body');
    }
  });
  chrome.tabs.executeScript(null, {file: "content_script.js"});
});
