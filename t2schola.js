var T2_QUARTER_BASE = 21;
var T2_COURSES_URL = "https://t2schola.titech.ac.jp/course/index.php?categoryid=";
var T2_COURSE_URL = "https://t2schola.titech.ac.jp/course/view.php?id=";

var T2_READ_SKIP = true;
var t2LoadCount;
var t2ForumLoadCount;

var t2Course;
var t2ReadDiscussion;

function t2LoadEnd(cb){
	t2LoadCount--;
	if(t2LoadCount == 0){
		chrome.storage.local.set({"t2Course": JSON.stringify(t2Course)}, function(){});
		chrome.storage.local.set({"t2ReadDiscussion": JSON.stringify(t2ReadDiscussion)}, function(){});
		chrome.storage.local.set({"t2Date": JSON.stringify(Math.floor(new Date().getTime()/1000))}, function(){});

		if(--zoomLoadCount == 0){
			cb("更新成功");
		}
	}
}

// T2Scholaの受講講義一覧を更新し、各講義のページにアクセスする
function T2CourseUpdate(cb){
	chrome.storage.local.get(["t2Course", "t2ReadDiscussion"], function(s){
		console.log("T2scholaのzoomアドレスを更新: " + new Date().toString());
		t2LoadCount = 0;
		t2ForumLoadCount = {};
		t2Course = parseJSON(s.t2Course) || [];
		t2ReadDiscussion = parseJSON(s.t2ReadDiscussion) || [];
		if(!T2_READ_SKIP){ t2ReadDiscussion = []; }
		
		for(var i=0; i<t2Course.length; i++){
			loadT2Course(cb, t2Course[i]);
		}
		var req = XHR(T2_COURSES_URL + (T2_QUARTER_BASE + QUARTER));
		t2LoadCount++;
		req.onload = function(){
			if(req.responseURL.indexOf("portal.nap.gsic.titech.ac.jp") != -1){
				console.log("T2scholaの読み込みに失敗");
				cb("一度Portalにログインして、再度更新してください");
				return;
			}
			var courseid = [];
			var element = req.responseXML.getElementsByClassName("coursebox");
			for(var i=0; i<element.length; i++){
				courseid[i] = element[i].dataset.courseid;
				if(indexOfId(t2Course, courseid[i]) == -1){
					t2Course[t2Course.length] = {
						id: courseid[i],
						title: element[i].firstChild.firstChild.innerText,
						zoom: []
					};
					loadT2Course(cb, t2Course[t2Course.length-1]);
				}
			}
			// 取り消した科目があったらリストから取り除く
			t2Course = t2Course.filter(function(c){
				return courseid.indexOf(c.id) != -1;
			});
			t2LoadEnd(cb);
		};
	});
}


function loadT2Course(cb, course){
	var req = XHR(T2_COURSE_URL + course.id);
	t2LoadCount++;
	req.onload = function(){
		var urls = req.responseXML.body.innerText.match(REGEXP_ZOOMURL) || [];
		if(urls.length){
			t2LoadEnd(cb);
			for(var i=0; i<urls.length; i++){
				addZoomURL(course.zoom, urls[i],lookforZoomDate(req.responseXML.body.innerText, urls[i]));
			}
		}
		else{
			var forum_url = "";
			var anchors = req.responseXML.getElementsByTagName("a");
			for(var i=0; i<anchors.length; i++){
				if(anchors[i].href.match(/https:\/\/t2schola\.titech\.ac\.jp\/mod\/forum\/view\.php\?id=/)){
					forum_url = anchors[i].href;
				}
			}
			loadT2Forum(cb, course.zoom, forum_url);
		}
	};
}

function loadT2Forum(cb, zoom, forum_url){
	var req = XHR(forum_url);
	req.onload = function(){
		var urls = req.responseXML.body.innerText.match(REGEXP_ZOOMURL) || [];
		if(urls.length){
			t2LoadEnd(cb);
			for(var i=0; i<urls.length; i++){
				addZoomURL(zoom, urls[i],lookforZoomDate(req.responseXML.body.innerText, urls[i]));
			}
		}
		else{
			var element = req.responseXML.getElementsByClassName("w-100 h-100 d-block");
			var flg = false;
			for(var i=0; i<element.length; i++){
				if(t2ReadDiscussion.indexOf(element[i].href) == -1){
					flg = true;
					t2ReadDiscussion[t2ReadDiscussion.length] = element[i].href;
					t2ForumLoadCount[forum_url] = t2ForumLoadCount[forum_url]? t2ForumLoadCount[forum_url]+1 : 1;
					loadT2Discussion(cb, zoom, forum_url, element[i].href)
				}
			}
			if(!flg){ t2LoadEnd(cb); }
		}
	};
}

function loadT2Discussion(cb, zoom, forum_url, discussion_url){
	var req = XHR(discussion_url);
	req.onload = function(){
		var urls = req.responseXML.body.innerText.match(REGEXP_ZOOMURL) || [];
		if(urls.length){
			for(var i=0; i<urls.length; i++){
				addZoomURL(zoom, urls[i],lookforZoomDate(req.responseXML.body.innerText, urls[i]));
			}
		}
		if(--t2ForumLoadCount[forum_url] == 0){ t2LoadEnd(cb); }
	};
}
