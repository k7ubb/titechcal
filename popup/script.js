// JSON文字列をオブジェクトに変換(エラー回避)
function parseJSON(json){
	try{
		return JSON.parse(json);
	}
	catch(e){
		return null;
	}
}


// UNIX時間をyyyy/m/d(曜) hh:mm形式文字列に変換
function unix2date(t){
	var time = new Date(t*1000);
	return time.toLocaleDateString() + "(" + [ "日", "月", "火", "水", "木", "金", "土" ][time.getDay()] + ") " + time.toLocaleTimeString().substr(0, time.toLocaleTimeString().length - 3);
}


// UNIX時間をm/d形式文字列に変換
function unix2day(t){
	var time = new Date(t*1000);
	return time.toLocaleDateString().replace(new Date().getFullYear()+"/", "");
}


function drawCalender(course, t2Course, ocwCourse){
	for(var i=0; i<5; i++){
		var tr = document.createElement("tr");
		var s = "<th>" + ["8:50<br>10:30", "10:40<br>12:20", "14:20<br>16:00", "16:15<br>17:55", "18:05<br>19:45"][i] + "</th>";
		for(var j=0; j<5; j++){
			var subj = "";
			var classstr = "course";
			var zoomstr = "";
			loop: for(var n=0; n<course.length; n++){
				for(var m=0; m<course[n].time.length; m++){
					if(course[n].time[m].indexOf(["月","火","水","木","金"][j]+(i*2+1)) != -1){
						subj = course[n].title;
						break loop;
					}
				}
			}
			if(subj){
				var zoom = [];
				for(var n=0; n<t2Course.length; n++){
					if(t2Course[n].title.replace(/[【】\s]/g, "").indexOf(subj.replace(/[【】\s]/g, "")) != -1){
						classstr += " t2";
						if(t2Course[n].zoom){
							for(var m=0; m<t2Course[n].zoom.length; m++){
								zoom[zoom.length] = t2Course[n].zoom[m];
							}
						}
					}
				}
				for(var n=0; n<ocwCourse.length; n++){
					if(ocwCourse[n].title.indexOf(subj) != -1){
						classstr += " ocw";
						if(ocwCourse[n].zoom){
							for(var m=0; m<ocwCourse[n].zoom.length; m++){
								var flag = true;
								for(var k=0; k<zoom.length; k++){
									if(zoom[k].url == ocwCourse[n].zoom[m].url){ flag = false; }
								}
								if(flag){
									zoom[zoom.length] = ocwCourse[n].zoom[m];
								}
							}
						}
					}
				}
				
				zoom.sort(function(a, b){
					return a.date - b.date;
				});
				
			
				for(var n=0; n<zoom.length; n++){
					if(!zoom[n].date < new Date().getTime()/1000){
						zoomstr += ("<li><a href=\"" + zoom[n].url + "\" target=\"_blank\">" + (zoom[n].date? unix2day(zoom[n].date) + " " : "") + "Meeting</a></li>");
					}
				}
				s += ("<td class=\"" + classstr + "\"><p>" + subj + "</p><ul>" + zoomstr + "</ul></td>");
			}
			else{
				s += "<td></td>";
			}
		}
		tr.innerHTML = s;
		document.getElementById("course").appendChild(tr);
	}
}


chrome.storage.local.get(["kyomuDate", "kyomuCourse", "t2Date", "t2Course", "ocwDate", "ocwCourse"], function(s){
	if(location.search){
		document.getElementById("status").innerHTML = decodeURI(location.search.slice(1));
	}
	
	document.getElementById("kyomu_date").innerHTML = (s.kyomuDate? unix2date(s.kyomuDate) : "未") + "取得";
	document.getElementById("t2_date").innerHTML = (s.t2Date? unix2date(s.t2Date) : "未") + "取得";
	document.getElementById("ocw_date").innerHTML = (s.ocwDate? unix2date(s.ocwDate) : "未") + "取得";
	
	drawCalender(parseJSON(s.kyomuCourse) || [], parseJSON(s.t2Course) || [], parseJSON(s.ocwCourse) || []);
	
	document.getElementById("kyomuUpdate").onclick = function(){
		document.getElementById("status").innerHTML = "更新中…";
		chrome.runtime.sendMessage("kyomuUpdate", function(r){
			location.search = encodeURI(r);
		});
	};
	
	document.getElementById("zoomUpdate").onclick = function(){
		document.getElementById("status").innerHTML = "更新中…";
		chrome.runtime.sendMessage("zoomUpdate", function(r){
			location.search = encodeURI(r);
		});
	};
});
