var getSelectedStories = function() {
  var ancs = $("a.selector.selected");
  var stories = $.map(ancs, function(selector) {
    var story = $(selector).closest(".story");
    var id = story.attr("class").match(/story_(\d+)/)[1];
    var link = "https://www.pivotaltracker.com/story/show/" + id;
    var status = story.attr("class").match(/delivered|finished|started/)[0];
    var storyName = story.find("span.story_name").text();
    return {
      id: id,
      story_name: storyName,
      link: link,
      status: status
    }
  });

  var res = [];
  var got = [];
  for (var i = 0; i < stories.length; i++) {
    var val = stories[i];

    if (got.indexOf(val.id) < 0) {
      res.push(val);
      got.push(val.id)
    }
  }
  return res;
}

chrome.extension.sendMessage({msg: "stories", stories: getSelectedStories()});
