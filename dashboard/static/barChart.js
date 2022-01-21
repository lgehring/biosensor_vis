// elements from html file (buttons and checkbox)
const buttonMonth_div = document.getElementById("ButtonMonth");
const buttonWeek_div = document.getElementById("ButtonWeek");
const buttonDay_div = document.getElementById("ButtonDay");
const buttonHour_div = document.getElementById("ButtonHour");
const statCheck_div = document.getElementById("stat");

// Helping functions:
const parseDateMinutes = d3.timeFormat("%d/%m/%Y %H:%M");
const parseDateHours = d3.timeFormat("%d/%m/%Y %H:00");
const parseDateDays = d3.timeFormat("%d/%m/%Y");
const parseDateWeeks = d3.timeFormat("CW %U/%Y");
const parseDateMonths = d3.timeFormat("%b %Y");

var enableDoubleClick = true;

// function which produces an array of the tick values in regular intervals
// necessary because a bar chart makes a tick at all bars if no tick array is specified
function getTickArray(dataArray){
	  nTicks = 6
		if (dataArray.length <= nTicks) {
			return dataArray.map(d => d.date)
		}
    const indicesBetweenPoints = Math.round(dataArray.length/nTicks)
    tickArray = []
    for (i = 0; i <= dataArray.length; i++){
      if (i%indicesBetweenPoints == 0){
        if (dataArray[i] != undefined){
          tickArray.push(dataArray[i])
        }
    }
  }
  return tickArray.map(d => d.date)
}


// cuts an array at given start and end value (not indices!!!)
function cutArray(array, start, end){
	startIndex = 0;
	endIndex = array.length - 1;
	i = 0
	iterator = array.values()
	for (const value of iterator){
		if (value["date"] == start){
			startIndex = i
		} if (value["date"] == end){
			endIndex = i
		}
		i += 1
	}
	return array.slice(startIndex, endIndex+1)
}

function getWeekDays(week, year){
	var anyDate = new Date(year, 0, 1 + (week - 1) * 7);  //any date within that week
  var anyDay = anyDate.getDay();
  var borderDay = anyDate;
	if (anyDay <= 4)
      borderDay.setDate(anyDate.getDate() - anyDate.getDay() + 1);
  else
      borderDay.setDate(anyDate.getDate() + 8 - anyDate.getDay());
	monday = new Date(borderDay)
	borderDay.setDate(monday.getDate() + 6)
	sunday = new Date(borderDay)
  return [parseDateDays(monday), parseDateDays(sunday)];

}

function handleClick(date){
	enableDoubleClick = true
	var datePrecision;
	if (/[A-Za-z]{3}/.test(date)){
		datePrecision = "Month"
	} else if (date.includes("CW")){
		datePrecision = "Week"
	} else if (/[0-9]{2}\/[0-9]{2}\/[0-9]{4}\ [0-9]{2}:[0]{2}/.test(date)){
		datePrecision = "Hour"
	} else if (/[0-9]{2}\/[0-9]{2}\/[0-9]{4}\ [0-9]{2}:[0-9]{2}/.test(date)){
		datePrecision = "Minute"
	} else {
		datePrecision = "Day"
	}

	switch (datePrecision) {
		case "Month":
			dataArray = nestedDataDays;
			dateDateTime = new Date(date)
			month = ("0" + (dateDateTime.getMonth() + 1)).slice(-2)
			year = dateDateTime.getFullYear()
			daysInMonth = new Date(year, month, 0).getDate()
			startDate = "01/"+ month + "/" + year
			endDate = daysInMonth + "/" + month  + "/" + year
			break;
		case "Week":
			dataArray = nestedDataDays;
			week = date.slice(3,5)
			year = date.slice(-4)
			weekDays = getWeekDays(week, year)
			startDate = weekDays[0]
			endDate = weekDays[1]
			break;
		case "Day":
			dataArray = nestedDataHours
			startDate = date + " 00:00"
			endDate = date + " 23:00"
			break;
		case "Hour":
			dataArray = nestedDataMinutes
			startDate = date
			endDate = date.substring(0, date.length-2) + "59"
			enableDoubleClick = false
			break;
		case "Minute":  // graph should not zoom in any further
			dataArray = nestedDataMinutes
			startDate = date.substring(0, date.length-2) + "00"
			endDate = date.substring(0, date.length-2) + "59"
			date = startDate
			alert("Zooming in further not possible.")

	}
	render(dataArray, startDate, endDate, date)
}

/*

 set svg dimensions and margins

*/
const svgWidth = 1200;
const svgHeight = 600;
const margin = {top: 60, right: 0, bottom: 60, left: 100}

// append the svg object to the body of the page
let svg = d3.select("#barChart")
  .append("svg")
  .attr("width", svgWidth + margin.left + margin.right)
  .attr("height", svgHeight + margin.top + margin.bottom)
  .attr("class", "chart")
  .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);


// the function render makes the plot and is called every time there by button click or brushing
const render = (data, startDate, endDate, title) => {
	// before every rendering everything is cleared from the svg
	svg.selectAll('*').remove();

	// if the render function is called through the updateChart function it does not
	// need to be converted, but cut
	if(data.constructor === Array){
		dataArray = data
	} else {
		// otherwise the map needs to be converted into an array
		dataArray = Array.from(data, ([date, value]) => ({ date, value }));
		originalData = dataArray.slice() //copies the array, so when user double clicks, this can be drawn
	}
	dataArray = cutArray(dataArray, startDate, endDate)

	/*

	Title Formatting

	*/

	svg.append("text")
		.attr('class', 'chartTitle')
		.style("font-family", "sans-serif")
		.style("font-size", "2.3em")
		.style("fill", "rgb(108, 105, 107)")
		.style("font-weight", "bold")
		.attr('y', svgHeight -625)
		.attr('x', svgWidth/2 + 25)
		.attr('text-anchor', 'middle')
		.text(title);

	/*

	X Scale

	*/

  xScale = d3.scaleBand()
    .domain(dataArray.map(d => d.date))
    .range([0, svgWidth])
		.padding(0.1)

  const ticks = getTickArray(dataArray)

	/*

	X axis formatting

	*/

  const xAxis = d3.axisBottom(xScale)
      .tickValues(ticks)
			.tickSizeOuter(0)
  const xAxisGroup = svg.append('g')
    .attr("transform", `translate(0, ${svgHeight})`)
    .call(xAxis)

  xAxisOffset = 55
  svg.append('text')
      .attr('class', 'axisLabel')
      .attr('y', svgHeight + xAxisOffset)
      .attr('x', svgWidth/2)
      .attr('text-anchor', 'middle')
      .text("Time Interval");

	/*

	Y Scale

	*/

  yScale = d3.scaleLinear()
    .domain([0, d3.max(dataArray, d => d.value)])
    .range([svgHeight, 0])

	/*

	Y axis formatting

	*/

  const yAxis = d3.axisLeft(yScale)
    .tickSizeOuter(0)
  const yAxisGroup = svg.append('g')
    .call(yAxis)

  yAxisOffset = -70
  svg.append('text')
    .attr('class', 'axisLabel')
    .attr('y', yAxisOffset)
    .attr('x', -svgHeight/2)
    .attr('transform', `rotate(-90)`) // rotate axis by 90 degrees x->y and y->x
    .attr('text-anchor', 'middle')
    .text("Steps");

  svg.selectAll(".tick")
    .filter(function (d) { return d === 0;  })
    .remove();

    // Add brushing
    brush = d3.brushX()
      .extent([[0,0], [svgWidth,svgHeight]])
      .on("end", updateChart)

	  const brusher = svg.append("g")

		/*

		Rendering the bars

		*/

			svg.selectAll("rect")
			.data(dataArray)
			.enter()
			.append("rect")
			.attr("class", "bars")
			.attr("x", d => xScale(d.date))
			.attr("y", d => yScale(d.value))
			.attr("height", d => svgHeight - yScale(d.value))
			.attr("width", xScale.bandwidth())
			.on("click", (i, d) => handleClick(d.date))
			.append("title")
				.text(d => "Date " + d.date + "\n" + "Steps: " + d.value)



			// if annation is true, but the change is not current, for instance when
			// graph was updated, the annotations need to be recalculated and redrawn
			if (annotation){
					annotateStats()
				}

		brusher.call(brush)
		svg.on("dblclick",function(){
			if (enableDoubleClick){
				 render(originalData, originalData[0], originalData.at(-1))
			}});

};

// function to update the chart, called after brushing
const updateChart = event => {
  extent = event.selection
	if (extent == null){
		return
	}
	// gets the selected region
  selected =  xScale.domain().filter(d =>
             	(extent[0] - xScale.bandwidth() <= xScale(d)) //bandwidth to include left bar, if touched by brush
							&& (xScale(d) <= extent[1]));
	render(dataArray, selected[0], selected.at(-1))
}

// function to annotate statistics
const annotateStats = () => {
  values = dataArray.map(d => d.value)
	// minima should not include 0
	valuesWithoutZero = values.filter(number => number != 0)
	min = d3.min(valuesWithoutZero)
	max= d3.max(values)
	avg = d3.mean(values)
	// put values in a map to map title to stat
	stats = new Map()
	stats.set("Minimum (not 0)", min); stats.set("Maximum", max); stats.set("Average", avg)
	statsArray = Array.from(stats, ([title, stat]) => ({title, stat}));

 // color scale to color stats differently
	const colors = ["rgb(61, 222, 77)", "rgb(240, 62, 28)", "rgb(254, 231, 24)"]
	var color = d3.scaleOrdinal()
		.domain(statsArray.map(d => d.title))
		.range(colors)


	// render the annotations
 	svg.selectAll("lines")
		.data(statsArray)
		.enter()
  	.append("line")
		.attr("x1", 0)
		.attr("x2", svgWidth)
		.attr("y1", d => yScale(d.stat))
		.attr("y2", d => yScale(d.stat))
		.style("stroke", d => color(d))
		.style("stroke-width", 5)
		.style("stroke-dasharray", ("6, 2"))
		.append("title")
		.text(d => d.title + ": " + d.stat)
}

d3.csv(dataset).then(data =>{
    data.forEach(d => {
			// format the Data correctly
      d.Steps = +d.Steps
			d.Calories = +d.Calories
			d.Heartrate = +d.HeartRate
			d.Temperature = +d.Temperature
      d.Time = d3.isoParse(d.Time)
			d.Minutes = parseDateMinutes(d.Time)
      d.Hours = parseDateHours(d.Time)
      d.Days = parseDateDays(d.Time)
      d.Weeks = parseDateWeeks(d.Time)
      d.Months = parseDateMonths(d.Time)

    });

		// nest the Data correctly into maps
		nestedDataMinutes = d3.rollup(data, v => d3.sum(v,d => d.Steps), d => d.Minutes)
    nestedDataHours = d3.rollup(data, v => d3.sum(v,d => d.Steps), d => d.Hours)
    nestedDataDays = d3.rollup(data, v => d3.sum(v,d => d.Steps), d => d.Days)
    nestedDataWeeks = d3.rollup(data, v => d3.sum(v,d => d.Steps), d => d.Weeks)
    nestedDataMonths = d3.rollup(data, v => d3.sum(v,d => d.Steps), d => d.Months)



		// Event Listening for the check box
		annotation = false
		statCheck_div.addEventListener("change", d => {
		if (d.target.checked){
			annotation = true
			annotateStats()
		} else {
			annotation = false
			svg.selectAll("line").remove()
		}
 	 })

	  // default case: Months are rendered
		var title = "Accumulated steps for every month"
		render(nestedDataMonths, nestedDataMonths[0], nestedDataMonths[-1], title)


		// event listeners for the buttons
    buttonHour_div.addEventListener("click", function(){
				title = "Accumulated steps for every hour"
        render(nestedDataHours, nestedDataHours[0], nestedDataHours[-1], title)
    })

    buttonDay_div.addEventListener("click", function(){
				title = "Accumulated steps for every day"
        render(nestedDataDays, nestedDataDays[0], nestedDataDays[-1], title)

    })

    buttonWeek_div.addEventListener("click", function(){
			 	title = "Accumulated steps for every week"
        render(nestedDataWeeks, nestedDataWeeks[0], nestedDataWeeks[-1], title)
    })

    buttonMonth_div.addEventListener("click", function(){
			  title = "Accumulated steps for every month"
        render(nestedDataMonths, nestedDataMonths[0], nestedDataMonths[-1], title)
    })



  })
