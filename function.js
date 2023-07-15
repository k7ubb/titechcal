var QUARTER = 3;
var ZOMEDAY_LENGTH = 200;

var REGEXP_ZOOMURL = /https:\/\/\w+web\.zoom\.us\/(j|meeting\/register)\/[\w\/\?=]+/g;
var REGEXP_DAY = /\d+\/\d+|\d+月\d+日/g;


chrome.storage.local.set({"version": chrome.runtime.getManifest().version}, function(){});

function XHR(url){
	var r = new XMLHttpRequest();
	r.open("get", url);
	r.responseType = "document";
	r.addEventListener("load", function(){ console.log("access: " + url); });
	r.addEventListener("error", function(){ console.error("access error: " + url); });
	r.send();
	return r;
}


function parseJSON(json){
	try{
		return JSON.parse(json);
	}
	catch(e){
		return null;
	}
}


function indexOfId(arr, id){
	for(var i=0; i<arr.length; i++){
		if(arr[i].id == id){ return i; }
	}
	return -1;
}


function lookforZoomDate(text, url){
	var days = text.substr(text.indexOf(url)-ZOMEDAY_LENGTH, ZOMEDAY_LENGTH).match(REGEXP_DAY);
	if(days){
		var date = days[days.length - 1].match(/(\d+)(\/|月)(\d+)/);
		return Math.floor(new Date(new Date().getYear()+1900, date[1]-1, date[3])/1000);
	}
	return "";
}


function addZoomURL(zoom, url, date){
	for(var i=0; i<zoom.length; i++){
		if(zoom[i].url == url){
			return;
		}
	}
	zoom[zoom.length] = {
		url: url,
		date: date
	};
}


var zoomLoadCount;

function zoomUpdate(cb){
	zoomLoadCount = 2;
	OCWCourseUpdate(cb);
	T2CourseUpdate(cb);
}

chrome.runtime.onMessage.addListener(function(mes, sender, cb){
	if(mes == "kyomuUpdate"){
		kyomuCourseUpdate(cb);
	}
	else if(mes == "zoomUpdate"){
		zoomUpdate(cb);
	}
	// message port closedを回避するために必要
	return true;
});
