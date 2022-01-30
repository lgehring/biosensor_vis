/***
 * @author Lea Heinen
 ***/

comboBox = document.getElementById("combo")

function bubbleChart(div){
	// Helping functions:

	// parse the dates to be used nested later on
	const parseDateHours = d3.timeFormat("%d.%m.%Y, %H:00");
	const getHourAndWeekDay = d3.timeFormat("%a,%H")

	function parseEuropeanDate(input) {
		// takes a european date and parses it into a iso date format
		var parts = input.match(/(\d+)/g);
		if (parts.length > 3){
			return new Date(parts[2], parts[1]-1, parts[0],
				parts[parts.length-2], parts[parts.length-1]);
		} else {
			return new Date(parts[2], parts[1]-1, parts[0]);
		}
	}

	function round(number){
		// rounds a number to 2 places after the comma
		return Math.round(number*100)/100
	}

	/*
	 set svg dimensions and margins
	*/
	const margin = {top: 100, right: 180, bottom: 40, left: 120};
	const svgWidth = 800  - margin.left - margin.right;
	const svgHeight = 360 - margin.top - margin.bottom;

	// append the svg object to the body of the page
	let svg = d3.select(div)
		.append("svg")
		.attr("width", svgWidth + margin.left + margin.right)
		.attr("height", svgHeight + margin.top + margin.bottom)
		.attr("class", "chart")
		.append("g")
				.attr("transform", `translate(${margin.left}, ${margin.top})`);


	const render = (dataArray, param) =>{
		// removes everything, when new plot is rendered
		svg.selectAll('*').remove();


		const xVal = d => d.Hour
		const yVal = d => d.Weekday
		const zVal = d => d.value

		/*
		 X Scale and X axis formatting
		*/
		const xScale = d3.scaleLinear()
		.domain(d3.extent(dataArray, xVal))
		.range([0, svgWidth])

		const xAxis = d3.axisTop(xScale)
			.ticks(24)
			.tickSize(0)
		const xAxisGroup = svg.append('g')
			.attr("transform", `translate( 0,${-40})`)
			.call(xAxis)
		xAxisGroup.selectAll('.domain').remove();

		// x axis label
		xAxisOffset = -80
		svg.append('text')
				.attr('class', 'axisLabel')
				.attr('y', xAxisOffset)
				.attr('x', svgWidth/2)
				.attr('text-anchor', 'middle')
				.text("Hour");


		/*
			Y Scale and y scale formatting
		*/


		const yScale = d3.scaleBand()
			.domain(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"])
			.range([0, svgHeight])

		const yAxis = d3.axisLeft(yScale)
			.ticks(7)
			.tickSize(0)
		const yAxisGroup = svg.append('g')
			.attr("transform", `translate( ${-30},${-15})`)
			.call(yAxis)
		yAxisGroup.selectAll('.domain').remove();

		// y axis label
		yAxisOffset = -100
		svg.append('text')
			.attr('class', 'axisLabel')
			.attr('y', yAxisOffset)
			.attr('x', -svgHeight/2)
			.attr('transform', `rotate(-90)`) // rotate axis by 90 degrees x->y and y->x
			.attr('text-anchor', 'middle')
			.text("Weekday");


			/*
			formatting the circles
			*/

		const circleScale = d3.scaleSqrt()
			.domain(d3.extent(dataArray, zVal))
			.range([1, 16])

		var circleFill = d3.scaleSequential()
			.domain(d3.extent(dataArray, zVal))
	    .interpolator(d3.interpolateRgb("rgb(134, 164, 255)", "rgb(3, 23, 88)"))


		// rendering the plot

		svg.selectAll("circles")
			.data(dataArray)
			.enter()
			.append("circle")
			.attr("class", "circles")
			.attr("cx", d => xScale(d.Hour))
			.attr("cy", d => yScale(d.Weekday))
			.attr("r", d => circleScale(d.value))
			.style("fill", d => circleFill(d.value))
			.append("title")
				.text(d => "Time: " + d.Weekday + " " +
							d.Hour +":00 - "+ (d.Hour+1) +":00"
							+ "\n" + param + ": " + round(d.value))


		// Legend for the circle sizes:
		xOffset = 85
	  bigCircleVal = d3.max(dataArray, zVal)
		smallCircleVal = d3.min(dataArray, zVal)
		mediumCircleVal = smallCircleVal + (bigCircleVal - smallCircleVal)/2 //gets exactly the point inbetween
	  legendVals = [bigCircleVal, mediumCircleVal] // biggest one on the bottom, so all can be hovered
	  svg.selectAll("legendCircles")
	    .data(legendVals)
	    .enter()
	    .append("circle")
				.attr("class", "circles")
	      .attr("cx", svgWidth + xOffset)
	      .attr("cy", d => svgHeight - margin.bottom -circleScale(d) -10)
	      .attr("r", d => circleScale(d))
	      .attr("stroke", "black")
	      .attr("opacity", 0.5)

				.append("title")
					.text(d => round(d))


		// Legend label
		svg.append("text")
			.attr("class", "axisLabel")
			.style("font-family", "sans-serif") // styling here, because it didn't work with css
			.style("font-size", "1.2em")
			.style("fill", "rgb(108, 105, 107)")
			.attr('y', svgHeight - margin.bottom - 70)
			.attr('x', svgWidth + xOffset)
			.attr('text-anchor', 'middle')
			.text(param)

	}


	d3.csv(dataset).then(data =>{
	    data.forEach(d => {
				// format the Data correctly
	      d.Steps = +d.Steps
				d.Calories = +d.Calories
				d.HR = +d.HR
				d.Temperature = +d.Temperature
				d.Time = d3.isoParse(d.Time)
				d.Hours = parseDateHours(d.Time)
	    });

			// default case:
			dataArray = prepareData("Steps", "sum")
			render(dataArray, "Steps")

			// event handeling for the combobox
			combo.addEventListener("change" , function(){
				var param;
				var operation;
				param = this.value


					if (param == "HR" || param == "Temperature"){
						operation = "mean";
					} else {
						operation = "sum"
					}
					dataArray = prepareData(param, operation)
					render(dataArray, param)

			})

			// function makes array of 7 weekdays by 24 hours
			function prepareData(param, operation){
				// FIRST STEP: rollup with sum or mean depending on param
				if (operation == "sum"){
					nestedDataHours = d3.rollup(data, v => d3.sum(v,d => eval("d." + param)), d => d.Hours)
				} else {
					nestedDataHours = d3.rollup(data, v => d3.mean(v,d => eval("d." + param)), d => d.Hours)
				}
				// turn into array
				hoursArray = Array.from(nestedDataHours, ([date, value]) => ({date, value}));

				// add HourAndWeekDay columns
				hoursArray.forEach(d => {
					d.HourAndWeekDay = getHourAndWeekDay(parseEuropeanDate(d.date))
				});

				// rollup of mean by Hour and weekday
				grouped = d3.rollup(hoursArray, v => d3.mean(v, d => d.value), d => d.HourAndWeekDay)
				arrayGrouped = Array.from(grouped, ([date, value]) => ({date, value}))

				// seperate hour and weekday into two columns
				arrayGrouped.forEach(d => {
					d.Weekday = d.date.split(",")[0]
					d.Hour = +d.date.split(",")[1]
				});
				return arrayGrouped;
			}
		});
}
