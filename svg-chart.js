
var SvgChart = (function(){
	"use strict";
	var NS = {
			xmlns: "http://www.w3.org/2000/svg",
			xlink: "http://www.w3.org/1999/xlink"
		},
		SVG_VERSION = "1.1",
		DEFAULT_STYLE = 'font:11px/1.25 "Lucida Grande","Lucida Sans Unicode",Verdana,Arial,Helvetica,sans-serif;';

	var SvgChart = function(options){
		for (var key in options) {
			this[key] = options[key];
		}

		this.plot_x = 5;
		this.plot_y = 35;
		this.plot_w = this.width - 10;
		this.plot_h = this.height - 65;
	};

	SvgChart.supported = !!(document.createElementNS && document.createElementNS(NS.xmlns, "svg").createSVGRect);

	SvgChart.factory = function(options){
		return new SvgChart(options);
	};

	SvgChart.prototype.setData = function(data){
		this.data = data;
		this.y_scales = getDataScales(data);
		this.x_scales = getTimeScales(data);
	};
	SvgChart.prototype.render = function(){
		// svg
		var svg = createSvgElement("svg", {
			version : SVG_VERSION,
			width   : this.width,
			height  : this.height,
			"xmlns:xlink" : NS.xlink,
			style   : DEFAULT_STYLE,
			viewBox : "0 0 " + this.width + " " + this.height
		});
		this.svg = svg;

		var defs = createSvgElement("defs");
		var marker = createSvgElement("circle", {
			id: "marker",
			cx: 0,
			cy: 0,
			r: 5,
			stroke: "#fff",
			"stroke-width": 1,
			"stroke-opacity": 0.5
		});
		var line = createSvgElement("path", {
			id: "line",
			d: "M 0 0 v " + this.plot_h,
			stroke: "#ccc",
			"stroke-width": 1
		});
		svg.appendChild(defs).appendChild(marker);
		defs.appendChild(line);

		// background
		var back = createSvgElement("rect", {
			x: 0,
			y: 0,
			width: this.width,
			height: this.height,
			fill: "#fff"
		});
		svg.appendChild(back);

		// axises
		createAxisY(this);
		createAxisX(this);

		createLegends(this);

		// plot
		var plot = createSvgElement("g", {
			transform: "translate(" + this.plot_x + "," + this.plot_y + ")"
		});
		svg.appendChild(plot);
		this.plot = plot;

		// trend lines
		createTrends(this);

		createTips(this);

		this.container.appendChild(svg);
	};

	function createLegends(chart) {
		var start = (chart.width - (chart.legendWidth * chart.lineCount)) / 2;
		var legends = createSvgElement("g", {
			transform: "translate(" + start + ",15)"
		});
		for (var i = 0; i < chart.lineCount; ++ i) {
			var legend = createSvgElement("g", {
				transform: "translate(" + (i * chart.legendWidth) + ",0)"
			});
			var path = createSvgElement("path", {
				fill: "none",
				stroke: chart.lineColors[i],
				"stroke-width": 2,
				d: "M 0 0 h 20"
			});
			var marker = createSvgElement("use", {
				"xlink:href": "#marker",
				fill: chart.lineColors[i],
				x: 10,
				y: 0,
				transform: "translate(2.25,0) scale(0.8,0.8)"
			});
			var text = createSvgElement("text", {
				"text-anchor": "start",
				fill: "#274b6d",
				"font-size": "12px",
				x: 25,
				y: 4
			});
			text.appendChild(document.createTextNode(chart.lineNames[i]));
			legend.appendChild(path);
			legend.appendChild(marker);
			legend.appendChild(text);
			legends.appendChild(legend);
		}
		chart.svg.appendChild(legends);
	}

	function copy(object) {
		var result = {};
		for (var i in object) {
			if (object.hasOwnProperty(i)) {
				result[i] = object[i];
			}
		}
		return result;
	}

	function createTips(chart) {
		var tips = createSvgElement("g", {
			visibility: "hidden",
			opacity: 0
		});
		var attrs = {
			rx: 3,
			ry: 3,
			x: 0.5,
			y: 0.5,
			width: chart.tipsWidth - 1,
			height: chart.tipsHeight - 1,
			fill: "#fff",
			"fill-opacity": 0.85,
			stroke: "#2f7ed8",
			"stroke-width": 1
		};

		var shadows = [
			[5, 0.05],
			[3, 0.1],
			[1, 0.15]
		];

		var shadowAttrs = copy(attrs);
		shadowAttrs.transform = "translate(1,1)";
		shadowAttrs.fill = "none";
		shadowAttrs.stroke = "#000";
		delete shadowAttrs["fill-opacity"];

		for (var i = 0; i < shadows.length; ++ i) {
			shadowAttrs["stroke-width"] = shadows[i][0];
			shadowAttrs["stroke-opacity"] = shadows[i][1];
			var shadow = createSvgElement("rect", shadowAttrs);
			tips.appendChild(shadow);
		}
		var rect = createSvgElement("rect", attrs);
		tips.appendChild(rect);

		var text = createSvgElement("text", {
			x: 8,
			y: 21,
			fill: "#333",
			"font-size": "12px"
		});
		tips.appendChild(text);

		var tpl = chart.tipsTpl,
			rElem = /<tspan((?:\s+[^=]+="[^"]*")*)>([^<]*)<\/tspan>/g,
			rAttr = /\s+([^=]+)="([^"]*)"/g,
			mElem, mAttr;

		var tipsElems = {},
			tipsAttrs = {};

		while (mElem = rElem.exec(tpl)) {
			var tspan = createSvgElement("tspan");
			text.appendChild(tspan);
			if (mElem[1]) {
				var a = {};
				while (mAttr = rAttr.exec(mElem[1])) {
					if (/^\{\$\w+\}$/.test(mAttr[2])) {
						tipsAttrs[mAttr[2].match(/^\{\$(\w+)\}$/)[1]] = [tspan, mAttr[1]];
					} else {
						a[mAttr[1]] = mAttr[2];
					}
				}
				setAttributes(tspan, a);
			}
			if (/^\{\$\w+\}$/.test(mElem[2])) {
				tipsElems[mElem[2].match(/^\{\$(\w+)\}$/)[1]] = tspan;
			} else {
				tspan.appendChild(document.createTextNode(mElem[2]));
			}
		}

		chart.svg.appendChild(tips);
		chart.tips = tips;
		chart.tipsElems = tipsElems;
		chart.tipsAttrs = tipsAttrs;
	}

	function createTrends(chart) {
		var trends = createSvgElement("g");
		var markers = createSvgElement("g");

		var x_scales = chart.x_scales,
			x_start = x_scales.start,
			x_pixels = chart.plot_w / (x_scales.end - x_start),
			y_scales = chart.y_scales,
			y_start = y_scales.start,
			y_pixels = chart.plot_h / (y_scales.end - y_start),
			colors = chart.lineColors;

		var pathList = [],
			markerList = [],
			xList = [],
			yList = [];
		for (var i = 0, l = chart.lineCount; i < l; ++ i) {
			pathList.push([]);
			yList.push([]);
			var marker = createSvgElement("use", {
				"xlink:href": "#marker",
				fill: colors[i],
				visibility: "hidden",
				opacity: 0
			});
			markers.appendChild(marker);
			markerList.push(marker);
		}

		var line = createSvgElement("use", {
			"xlink:href": "#line",
			visibility: "hidden",
			opacity: 0
		});

		var data = chart.data;
		for (var i = 0, m = data.length; i < m; ++ i) {
			var d = data[i];
			var x = x_pixels * (d.time - x_start);
			xList.push(x);
			for (var j = 0; j < l; ++ j) {
				var val = d.values[j];
				var y = chart.plot_h - (val - y_start) * y_pixels;
				pathList[j].push(x + " " + y);
				yList[j].push(y);
			}
		}

		for (var i = 0; i < l; ++ i) {
			var path = createSvgElement("path", {
				fill: "none",
				stroke: colors[i],
				"stroke-width": 2,
				d: data.length == 1 ? "M " + pathList[i][0].replace(/^\S+/, "0") + " h " + chart.plot_w : "M " + pathList[i].join(" L ")
			});
			trends.appendChild(path);
		}

		chart.plot.appendChild(trends);
		chart.plot.appendChild(line);
		chart.plot.appendChild(markers);

		chart.svg.onmousemove = function(e){
			var bcr = chart.svg.getBoundingClientRect(),
				offsetX = e.clientX - bcr.left,
				offsetY = e.clientY - bcr.top;
			if (offsetY < chart.plot_y || offsetY > chart.plot_y + chart.plot_h) {
				return removeTips();
			}
			var x = offsetX - chart.plot_x,
				len = xList.length,
				index = 0;
			for (var i = 0; i < len; ++ i) {
				if (x >= xList[i]) {
					index = i;
				} else {
					break;
				}
			}
			if (index < len - 1) {
				if (x > (xList[index] + xList[index + 1]) / 2) {
					++ index;
				}
			}
			x = xList[index];
			for (i = 0; i < l; ++ i) {
				setAttributes(markerList[i], {
					x: x,
					y: yList[i][index],
					visibility: "visible",
					opacity: 1
				});
			}
			setAttributes(line, {
				transform: "translate(" + (0.5 + Math.round(x - 0.5)) + ",0)",
				visibility: "visible",
				opacity: 1
			});

			var d = chart.tipsCb(data[index].time, data[index].values, data[index-1] && data[index-1].values);
			for (i in d) {
				if (d.hasOwnProperty(i)) {
					if (i in chart.tipsElems) {
						chart.tipsElems[i].textContent = d[i];
					}
					if (i in chart.tipsAttrs) {
						var a = {};
						a[chart.tipsAttrs[i][1]] = d[i];
						setAttributes(chart.tipsAttrs[i][0], a);
					}
				}
			}
			var tipsX = offsetX + 10,
				tipsY = offsetY - chart.tipsHeight / 2;
			if (tipsX + chart.tipsWidth > chart.width - 5) {
				tipsX = offsetX - chart.tipsWidth - 10;
			}
			if (tipsY + chart.tipsHeight > chart.height - 35) {
				tipsY = chart.height - chart.tipsHeight - 35;
			}
			if (tipsY < chart.plot_y + 5) {
				tipsY = chart.plot_y + 5;
			}
			setAttributes(chart.tips, {
				visibility: "visible",
				opacity: 1,
				transform: "translate("+ tipsX + "," + tipsY + ")"
			});
		};
		chart.svg.onmouseout = removeTips;
		function removeTips() {
			var hidden = {
				visibility: "hidden",
				opacity: 0
			};
			for (var i = 0; i < l; ++ i) {
				setAttributes(markerList[i], hidden);
			}
			setAttributes(line, hidden);
			setAttributes(chart.tips, hidden);
		}
	}

	function createAxisX(chart) {
		var axis = createSvgElement("g", {
				transform: "translate(" + chart.plot_x + "," + (chart.plot_y + chart.plot_h) + ")"
			}),
			lines = createSvgElement("g"),
			labels = createSvgElement("g", {
				fill: "#666",
				transform: "translate(0,17)"
			});

		var scales = chart.x_scales,
			ticks = scales.ticks,
			start = scales.start,
			end = scales.end,
			unit = scales.unit,
			interval = scales.interval,
			w = chart.plot_w,
			pixels = w / (end - start),
			date = new Date();

		for (var i = 0; i < ticks.length; ++ i) {
			var x = pixels * (ticks[i] - start);
			x = 0.5 + Math.round(x - 0.5);
			if (x < 20) {
				continue;
			}
			if (x > w - 20) {
				break;
			}
			date.setTime(ticks[i]);
			var text = "";
			switch (unit) {
				case "millisecond":
					var second = date.getSeconds() + date.getMilliseconds() / 1e3;
					text = second.toFixed(interval < 10 ? 3 : (interval < 100 ? 2 : 1));
					break;
				case "second":
					text = php_date("i:s", date);
					break;
				case "minute":
					text = php_date("H:i", date);
					break;
				case "hour":
					var hour = date.getHours();
					text = php_date(hour == 0 ? "n月j日" : "H:00", date);
					break;
				case "day":
				case "week":
					text = php_date("n月j日", date);
					break;
			}
			var line = createSvgElement("path", {
				fill: "none",
				stroke: "#ccc",
				"stroke-width": 1,
				d: "M " + x + " 0 v 5"
			});
			lines.appendChild(line);

			var label = createSvgElement("text", {
				"text-anchor": "middle",
				x: x,
				y: 0
			});
			label.appendChild(document.createTextNode(text));
			labels.appendChild(label);
		}

		axis.appendChild(lines);
		axis.appendChild(labels);
		chart.svg.appendChild(axis);
	}

	function createAxisY(chart) {
		var axis = createSvgElement("g", {
				transform: "translate(" + chart.plot_x + "," + chart.plot_y + ")"
			}),
			lines = createSvgElement("g"),
			labels = createSvgElement("g", {
				fill: "#666",
				transform: "translate(3,-5)"
			});

		var scales = chart.y_scales,
			ticks = scales.ticks,
			pixels = chart.plot_h / (ticks.length - 1);

		for (var i = 0; i < ticks.length; ++ i) {
			var y = chart.plot_h - pixels * i;
			y = 0.5 + Math.round(y - 0.5);
			var line = createSvgElement("path", {
				fill: "none",
				stroke: "#ccc",
				"stroke-width": 1,
				d: "M 0 " + y + " h " + chart.plot_w
			});
			lines.appendChild(line);

			var label = createSvgElement("text", {
				// "text-anchor": "start",
				y : y
			});
			label.appendChild(document.createTextNode(ticks[i]));
			labels.appendChild(label);
		}

		axis.appendChild(lines);
		axis.appendChild(labels);
		chart.svg.appendChild(axis);
	}

	function createSvgElement(tagName, attributes) {
		var element = document.createElementNS(NS.xmlns, tagName);
		if (attributes) {
			setAttributes(element, attributes);
		}
		return element;
	}

	function setAttributes(element, attributes) {
		for (var key in attributes) {
			if (attributes.hasOwnProperty(key)) {
				var val = attributes[key];
				if (/:/.test(key)) {
					key = key.split(":");
					element.setAttributeNS(NS[key[0]], key[1], val);
				} else {
					element.setAttribute(key, val);
				}
			}
		}
	}

	function getDataScales(data) {
		var min = Infinity;
		var max = - min;
		for (var i = 0, l = data.length; i < l; ++ i) {
			var d = data[i].values;
			for (var j = 0; j < d.length; ++ j) {
				var val = d[j];
				if (val > max) {
					max = val;
				}
				if (val < min) {
					min = val;
				}
			}
		}

		if (max == min) {
			return {
				min: min,
				max: max,
				start: min - min,
				end: max + max,
				interval: 1,
				ticks: ["", min, ""]
			};
		}

		var span = max - min;
		var digit = Math.floor(Math.log(span) / Math.LN10) - 1;
		var temp = Math.floor(span / Math.pow(10, digit));

		var interval, count, start, end;
		if (temp < 16) {
			interval = 2;
		} else if (temp < 20) {
			interval = 4;
		} else if (temp < 40) {
			interval = 5;
		} else if (temp < 80) {
			interval = 10;
		} else {
			interval = 20;
		}

		interval *= Math.pow(10, digit);
		start = interval * (Math.floor(min / interval));
		end = interval * (Math.ceil(max / interval));
		count = Math.round((end - start) / interval) + 1;

		var ticks = [];
		for (i = 0; i < count; ++ i) {
			val = start + i * interval;
			if (digit < 0) {
				val = val.toFixed(- digit);
			} else {
				val = + val.toPrecision(15);
			}
			ticks.push(val);
		}

		return {
			min: min,
			max: max,
			start: + start.toPrecision(15),
			end: + end.toPrecision(15),
			interval: interval,
			ticks: ticks
		};
	}

	function getTimeScales(data) {
		var start = data[0].time, 
			end = data[data.length - 1].time,
			normalized = normalizeTimeTickInterval((end - start) / 8),
			unitName = normalized.unitName,
			unitRange = normalized.unitRange,
			multiple = normalized.multiple,
			ticks = [],
			date = new Date(start),
			setter, getter;
		if (start == end) {
			return {
				start: start - 8.64e7,
				end: end + 8.64e7,
				interval: 8.84e7,
				unit: "day",
				ticks: ["", start, ""]
			};
		}
		/*if (unitName == "week") {
			unitRange /= 7;
			multiple *= 7;
			unitName = "day";
		}*/
		switch (unitName) {
			case "millisecond":
				setter = "setMilliseconds";
				getter = "getMilliseconds";
				break;
			case "second":
				date.setMilliseconds(0);
				setter = "setSeconds";
				getter = "getSeconds";
				break;
			case "minute":
				date.setSeconds(0, 0);
				setter = "setMinutes";
				getter = "getMinutes";
				break;
			case "hour":
				date.setMinutes(0, 0, 0);
				setter = "setHours";
				getter = "getHours";
				break;
			case "day":
				date.setHours(0, 0, 0, 0);
				setter = "setDate";
				getter = "getDate";
				break;
			case "month":
				date.setHours(0, 0, 0, 0);
				date.setDate(1);
				setter = "setMonth";
				getter = "getMonth";
				break;
			case "year":
				date.setHours(0, 0, 0, 0);
				date.setMonth(0, 1);
				setter = "setFullYear";
				getter = "getFullYear";
				break;
			default:
				throw "unknow unitName \"" + unitName + "\"";
		}
		date[setter](Math.ceil(date[getter]() / multiple) * multiple);
		while (true) {
			var time = date.getTime();
			if (time >= start) {
				if (time > end) {
					break;
				}
				ticks.push(time);
			}
			date[setter](date[getter]() + multiple);
		}

		normalized.ticks = ticks;
		return {
			start: start,
			end: end,
			interval: unitRange * multiple,
			unit: unitName,
			ticks: ticks
		};
	}

	function normalizeTimeTickInterval(tickInterval) {
		var units = [
			["millisecond", [1, 2, 5, 10, 20, 25, 50, 100, 200, 500]],
			["second", [1, 2, 5, 10, 15, 30]],
			["minute", [1, 2, 5, 10, 15, 30]],
			["hour", [1, 2, 3, 4, 6, 8, 12]],
			["day", [1, 2, 5, 10, 15]],
			// ["week", [1, 2]],
			["month", [1, 2, 3, 4, 6]],
			["year", null]
		];
		var timeUnits = {
			millisecond: 1,
			second: 1e3,
			minute: 6e4,
			hour: 3.6e6,
			day: 8.64e7,
			week: 6.048e8,
			month: 2.592e9,
			year: 3.1536e10
		};
		var unit = units[units.length - 1],
			interval = unit[0],
			multiples = unit[1];
		for (var i=0; i<units.length; ++i) {
			unit = units[i];
			interval = timeUnits[unit[0]];
			multiples = unit[1];
			if (units[i + 1]) {
				// lessThan is in the middle between the highest multiple and the next unit.
				var lessThan = (interval * multiples[multiples.length - 1] + timeUnits[units[i + 1][0]]) / 2;

				// break and keep the current unit
				if (tickInterval <= lessThan) {
					break;
				}
			}
		}
		// prevent 2.5 years intervals, though 25, 250 etc. are allowed
		if (interval === timeUnits.year && tickInterval < 5 * interval) {
			multiples = [1, 2, 5];
		}

		// multiples for a linear scale
		if (!multiples) {
			multiples = [1, 2, 2.5, 5, 10];
		}

		// normalize the interval to the nearest multiple
		var multiple = 1;
		var normalized = tickInterval / interval;
		for (i = 0; i < multiples.length; i++) {
			multiple = multiples[i];
			if (normalized <= (multiples[i] + (multiples[i + 1] || multiples[i])) / 2) {
				break;
			}
		}

		return {
			unitRange: interval,
			multiple: multiple,
			unitName: unit[0]
		};
	}

	return SvgChart;
})();
