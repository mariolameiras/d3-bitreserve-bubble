(function() {

	/* Events from UI */


	//	var region = document.getElementById('region');
	var picker = document.getElementById('dtypePicker');
	var dtype = picker.options[picker.selectedIndex].value;
	var timerId = 0;

	picker.addEventListener('change', function(e) {
		dtype = picker.options[picker.selectedIndex].value;
		clearInterval(timerId);
		drawBubbles();
		timerId = setInterval(drawBubbles, 10000);

	}, false);

	var isRunning = true;
	var button = document.getElementById('toggle');

	button.addEventListener('click', function(e) {
		if (isRunning) {
			clearInterval(timerId);
			button.value = 'Stream again';
			isRunning = false;
		} else {
			getData();
			button.value = 'Stop';
			isRunning = true;
		}

	}, false);


	/* D3 Bubble Chart */

	var diameter = Math.min(document.getElementById('chart').clientWidth, window.innerHeight - document.querySelector('header').clientHeight) - 50;

	var svg = d3.select('#chart').append('svg')
	.attr('width', diameter)
	.attr('height', diameter)
	.append("g");

	var bubble = d3.layout.pack()
	.size([diameter, diameter])
	.value(function(d) {
		return d.size;
	}) 
	.padding(7);



	function drawBubbles(m) {

		// generate data with calculated layout values
		d3.xhr("https://nodeproxy.eu-gb.mybluemix.net/?url=https://api.bitreserve.org/v0/reserve/statistics","application/json", function(error, root) {

			var nodes = bubble.nodes(processData(JSON.parse(root.response)))
			.filter(function(d) {
				return !d.children;
			}); // filter out the outer bubble

		// assign new data to existing DOM 
		var vis = svg.selectAll('circle')
		.data(nodes, function(d) {
			return d.name;
		});

		var duration = 1000;
		var delay = 0;

		// update - this is created before enter.append. it only applies to updating nodes.
		vis.transition()
		.duration(duration)
		.delay(function(d, i) {
			delay = i * 7;
			return delay;
		})
		.attr('transform', function(d) {
			return 'translate(' + d.x + ',' + d.y + ')';
		})
		.attr('r', function(d) {
			return d.r;
		})
			.style('opacity', 0.8); // force to 1, so they don't get stuck below 1 at enter()

		// enter - only applies to incoming elements (once emptying data)	
		vis.enter().append('circle')
		.attr('transform', function(d) {
			return 'translate(' + d.x + ',' + d.y + ')';
		})
		.attr('r', function(d) {
			return d.r;
		})
		.attr('class', function(d) {
			return d.className;
		})
		.style('opacity', 0)
		.transition()
		.duration(duration * 1.2)
		.style('opacity', 0.8);

		// exit
		vis.exit()
		.transition()
		.duration(duration + delay)
		.style('opacity', 0)
		.remove();
	});
}


/* Bitreserve */


function processData(data) {
	if (!data) return;


	var newDataSet = [];
	console.log(dtype);
	for (var prop in data) {
		var nested = [];
		if(dtype === "assets")
		{
			for(var n in data[prop].values)
			{

				nested.push({
					name: data[prop].values[n].currency,
					className: data[prop].values[n].currency,
					size: data[prop].values[n].assets,
				});
			}}
			newDataSet.push({
				name: data[prop].currency,
				className: data[prop].currency,
				size: data[prop].totals[dtype],
				children:nested,
			});
		}
		return {
			children: newDataSet
		};
	}

	drawBubbles();
	timerId = setInterval(drawBubbles, 10000);

})();