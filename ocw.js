var OCW_INDEX_URL = "https://secure.ocw.titech.ac.jp/ocwi/index.php?module=Ocwi&action=Index";
var OCW_COURSES_URL = "https://secure.ocw.titech.ac.jp/ocwi/index.php?module=Ocwi&action=LectureList";

var ocwLoadCount;

var ocwCourse;
var ocwRRS;

function ocwLoadEnd(cb){
	ocwLoadCount--;
	if(ocwLoadCount == 0){
		chrome.storage.local.set({"ocwCourse": JSON.stringify(ocwCourse)}, function(){});
		chrome.storage.local.set({"ocwRRS": JSON.stringify(ocwRRS)}, function(){});
		chrome.storage.local.set({"ocwDate": JSON.stringify(Math.floor(new Date().getTime()/1000))}, function(){});
		if(--zoomLoadCount == 0){
			cb("更新成功");
		}
	}
}


// OCW-iの受講講義一覧を更新し、各講義のページにアクセスする
function OCWCourseUpdate(cb){
	chrome.storage.local.get(["ocwCourse", "ocwRRS"], function(s){
		console.log("OCW-iのzoomアドレスを更新: " + new Date().toString());
		ocwLoadCount = 0;
		ocwCourse = parseJSON(s.ocwCourse) || [];
		ocwRRS = parseJSON(s.ocwRRS);
		if(ocwRRS){
			loadOCWRRS(cb, ocwCourse);
		}
		else{
			var req2 = XHR(OCW_INDEX_URL);
			ocwLoadCount++;
			req2.onload = function(){
				ocwRRS = req2.responseXML.getElementsByClassName("rss")[0].firstChild.href;
				loadOCWRRS(cb, ocwCourse);
				ocwLoadEnd(cb);
			};
		}
		var req = XHR(OCW_COURSES_URL);
		ocwLoadCount++;
		req.onload = function(){
			if(req.responseURL.indexOf("portal.nap.gsic.titech.ac.jp") != -1 || req.responseXML.body.innerText.indexOf("TokyoTechPortalからログインしてください。") != -1){
				console.log("OCW-iの読み込みに失敗");
				cb("一度OCW-iを開いて、再度更新してください");
				return;
			}
			var courseid = [];
			var element = req.responseXML.getElementsByTagName("table");
			for(var i=0; i<element.length; i++){
				var title = element[i].firstElementChild.firstChild.firstElementChild.innerHTML.replace(new Date().getYear()+1900, "");
				if(title.indexOf(QUARTER) != -1){
					var tr = element[i].firstElementChild.children;
					for(var j=0; j<tr.length; j++){
						if(tr[j].firstElementChild && tr[j].firstElementChild.firstChild.tagName == "A"){
							courseid[courseid.length] = tr[j].firstElementChild.firstChild.href.slice(-9);
							if(indexOfId(ocwCourse, courseid[courseid.length - 1]) == -1){
								ocwCourse[ocwCourse.length] = {
									id: courseid[courseid.length - 1],
									title: tr[j].firstElementChild.firstChild.innerText,
									zoom: []
								};
							}
						}
					}
				}
			}
			// 取り消した科目があったらリストから取り除く
			ocwCourse = ocwCourse.filter(function(c){
				return courseid.indexOf(c.id) != -1;
			});
			ocwLoadEnd(cb);
		};
	});
}


function loadOCWRRS(cb, courses){
	var req = XHR(ocwRRS);
	ocwLoadCount++;
	req.onload = function(){
		var items = req.responseXML.getElementsByTagName("item");
		for(var i=0; i<items.length; i++){
			var urls = items[i].textContent.match(REGEXP_ZOOMURL);
			if(urls){
				for(var j=0; j<courses.length; j++){
					if(items[i].textContent.indexOf(courses[j].title) != -1){
						for(var k=0; k<urls.length; k++){
							addZoomURL(courses[j].zoom, urls[k], lookforZoomDate(items[i].textContent, urls[k]));
						}
					}
				}
			}
		}
		ocwLoadEnd(cb);
	};
}
