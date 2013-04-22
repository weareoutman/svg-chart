
var data = (function(source){
	var data = [];
	for (var i = 0, l = source.length; i < l; ++ i) {
		var d = source[i];
		data.unshift({
			time: new Date(d[4].replace(/-/g, "/")).getTime(),
			values: d.slice(0, 3)
		});
	}
	return data;
})(source);

// var colors = ["#ed561b", "#8bbc21", "#2f7ed8"];
var colors = ["#f30", "#3a0", "#03f"];

var options = {
	width: 600,
	height: 400,
	container: document.querySelector("#container"),
	lineCount: 3,
	lineColors: colors,
	lineNames: ["胜", "平", "负"],
	legendWidth: 60,
	tipsWidth: 120,
	tipsHeight: 100,
	tipsTpl: [
		'<tspan x="8" font-size="12px" fill="#666">{$time}</tspan>',
		'<tspan x="8" dy="16" fill="' + colors[0] + '">胜</tspan><tspan> : </tspan><tspan font-weight="bold">{$win}</tspan><tspan> </tspan><tspan fill="{$cwin}" font-weight="bold" font-size="13px">{$twin}</tspan>',
		'<tspan x="8" dy="16" fill="' + colors[1] + '">平</tspan><tspan> : </tspan><tspan font-weight="bold">{$draw}</tspan><tspan> </tspan><tspan fill="{$cdraw}" font-weight="bold" font-size="13px">{$tdraw}</tspan>',
		'<tspan x="8" dy="16" fill="' + colors[2] + '">负</tspan><tspan> : </tspan><tspan font-weight="bold">{$lost}</tspan><tspan> </tspan><tspan fill="{$clost}" font-weight="bold" font-size="13px">{$tlost}</tspan>',
		'<tspan x="8" dy="16">返还率</tspan><tspan> : </tspan><tspan font-size="11px">{$ret}</tspan>'
	].join(""),
	tipsCb: function(time, self, prev){
		function trend(i) {
			var diff = prev && (self[i] - prev[i]);
			return prev ? (diff > 0 ? 0 : (diff < 0 ? 1 : 2)) : 2;
		}
		function color(i) {
			return ["red", "green", "inherit"][trend(i)];
		}
		function arrow(i) {
			return ["\u2191", "\u2193", ""][trend(i)];
		}
		return {
			time: php_date("n月j日 H:i", time),
			win: self[0].toFixed(2),
			cwin: color(0),
			twin: arrow(0),
			draw: self[1].toFixed(2),
			cdraw: color(1),
			tdraw: arrow(1),
			lost: self[2].toFixed(2),
			clost: color(2),
			tlost: arrow(2),
			"ret": (100 / (1 / self[0] + 1 / self[1] + 1 / self[2])).toFixed(2) + "%"
		}
	}
};

var chart = SvgChart.factory(options);
// chart.render();

chart.setData(data);
chart.render();
