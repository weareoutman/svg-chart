
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

/*var data = [
	{
		time: Date.now(),
		values: [100, 200]
	},
	{
		time: Date.now() + 3000,
		values: [300, 400]
	}
];
*/

// # init
// set width, height
// set container

// # data
// analyse data

// # render
// create svg
// create y-axis
// create x-axis
// create trend line

var options = {
	width: 600,
	height: 400,
	container: "#container",
	lineCount: 3,
	lineColors: ["#ed561b", "#2f7ed8", "#8bbc21"]
	// type: "timeline",
	// data: data
};

var chart = SvgChart.factory(options);
// chart.render();

chart.setData(data);
chart.render();
