(function() {

	/* Events from UI */


	//	var region = document.getElementById('region');
	var picker = document.getElementById('dtypePicker');
	var dtype = picker.options[picker.selectedIndex].value;
	var timerId = 0;

	picker.addEventListener('change', function(e) {
		dtype = picker.options[picker.selectedIndex].value;
//		console.log(dtype);
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
	.attr('height', diameter);

	var bubble = d3.layout.pack()
	.size([diameter, diameter])
	.value(function(d) {
		return d.size;
		}) // new data is loaded to bubble layout
	.padding(3);

	function drawBubbles(m) {

		// generate data with calculated layout values
		var nodes = bubble.nodes(processData(m))
		.filter(function(d) {
			return !d.children;
			}); // filter out the outer bubble

		// assign new data to existing DOM 
		var vis = svg.selectAll('circle')
		.data(nodes, function(d) {
			return d.name;
		});

		// enter data -> remove, so non-exist selections for upcoming data won't stay -> enter new data -> ...

		// To chain transitions, 
		// create the transition on the updating elements before the entering elements 
		// because enter.append merges entering elements into the update selection

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
			.style('opacity', 1); // force to 1, so they don't get stuck below 1 at enter()

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
		.style('opacity', 1);

		// exit
		vis.exit()
		.transition()
		.duration(duration + delay)
		.style('opacity', 0)
		.remove();
	}


	/* Bitreserve */


	function getData() {
		var i = 0;


		$.ajax({
			url: "http://localhost:8080/api/bitreserve"
		}).then(function(data) {
	    console.log(data[0].currency);
		drawBubbles(data);
	});
	}

	function processDataCurrency(data) {
		if (!data) return;

		var newDataSet = [];

		for (var prop in data['currency']) {
			newDataSet.push({
				name: data[prop].values.currency,
				className: data[prop].values.currency,
				size: data[prop].values.assets
			});
		}
		return {
			children: newDataSet
		};
	}

	function processData(data) {
		if (!data) return;

		var newDataSet = [];

		for (var prop in data) {
			newDataSet.push({
				name: data[prop].currency,
				className: data[prop].currency,
				size: data[prop].totals[dtype]
			});
		}
		return {
			children: newDataSet
		};
	}

	timerId = setInterval(getData, 2000);

})();