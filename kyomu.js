var KYOMU_URL = "https://kyomu2.gakumu.titech.ac.jp/Titech/Student/%E7%A7%91%E7%9B%AE%E7%94%B3%E5%91%8A/PID1_1.aspx";

// 教務webの曜日・時限表記からコマの配列を生成
function text2times(s){
	var t = s.match(/[月火水木金]\d-\d/g);
	if(!t){ return []; }
	for(var i=0, l=t.length; i<l; i++){
		if(t[i].charAt(3) - t[i].charAt(1) > 1){
			t[t.length] = t[i].charAt(0) + (Number(t[i].charAt(1))+2);
		}
		t[i] = t[i].substr(0,2);
		if(t[i].charAt(1) == "5" && s.indexOf("昼時間帯") != -1){
			t[i] += "昼";
		}
	}
	return t;
}


function kyomuCourseUpdate(cb){
	console.log("カレンダーを更新: " + new Date().toString());
	var req = XHR(KYOMU_URL);
	req.onload = function(){
		if(req.responseURL.indexOf("portal.nap.gsic.titech.ac.jp") != -1){
			console.log("教務webの読み込みに失敗")
			cb("一度教務webを開いて、再度更新してください");
			return;
		}
		var kyomuCourse = [];
		var element = req.responseXML.getElementsByClassName("tdQuarter" + QUARTER);
		for(var j=0; j<element.length; j++){
			kyomuCourse[kyomuCourse.length] = {
				"time": text2times(element[j].parentNode.children[1].innerText.replace(/[\n\s]{2,}/g, "")),
				"code": element[j].parentNode.children[3].innerText.replace(/[\n\s]{2,}/g, ""),
				"title": element[j].parentNode.children[4].children[0].innerText.replace(/[\n\s]{2,}/g, ""),
				"teacher": element[j].parentNode.children[5].innerText.replace(/[\n\s]{2,}/g, "")
			};
		}
		element = req.responseXML.getElementsByClassName("tdQuarter" + (Math.floor((QUARTER-1)/2+7)));
		for(var j=0; j<element.length; j++){
			kyomuCourse[kyomuCourse.length] = {
				"time": text2times(element[j].parentNode.children[1].innerText.replace(/[\n\s]{2,}/g, "")),
				"code": element[j].parentNode.children[3].innerText.replace(/[\n\s]{2,}/g, ""),
				"title": element[j].parentNode.children[4].children[0].innerText.replace(/[\n\s]{2,}/g, ""),
				"teacher": element[j].parentNode.children[5].innerText.replace(/[\n\s]{2,}/g, "")
			};
		}
		chrome.storage.local.set({"kyomuCourse": JSON.stringify(kyomuCourse)}, function(){});
		chrome.storage.local.set({"kyomuDate": JSON.stringify(Math.floor(new Date().getTime()/1000))}, function(){});
		cb("更新成功");
	};
}
