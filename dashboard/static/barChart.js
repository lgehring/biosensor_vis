const buttonMonth_div = document.getElementById("ButtonMonth");
const buttonWeek_div = document.getElementById("ButtonWeek");
const buttonDay_div = document.getElementById("ButtonDay");
const buttonHour_div = document.getElementById("ButtonHour");
const statCheck_div = document.getElementById("stat");

// Helping functions:
var parseDateHours = d3.timeFormat("%d/%m/%Y %H:00");
var parseDateDays = d3.timeFormat("%d/%m/%Y");
var parseDateWeeks = d3.timeFormat("CW %U/%Y");
var parseDateMonths = d3.timeFormat("%b %Y");

function getTickArray(dataArray){
		if (dataArray.length <= 5) {
			return dataArray.map(d => d.date)
		}
    const indicesBetweenPoints = Math.round(dataArray.length/6)
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

// set svg dimensions and margins
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

const render = (data, startDate, endDate, title) => {
	svg.selectAll('*').remove();
	if(data.constructor === Array){
		dataArray = data
		dataArray = cutArray(dataArray, startDate, endDate)
	} else {
		dataArray = Array.from(data, ([date, value]) => ({ date, value }));
		originalData = dataArray.slice() //copies the array, so when used double clicks, this can be drawn
	}

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

  xScale = d3.scaleBand()
    .domain(dataArray.map(d => d.date))
    .range([0, svgWidth])
		.padding(0.1)

  const ticks = getTickArray(dataArray)

  const xAxis = d3.axisBottom(xScale)
      .tickValues(ticks)
			.tickSizeOuter(0)
  const xAxisGroup = svg.append('g')
    .attr("transform", `translate(0, ${svgHeight})`)
    .call(xAxis)
  //xAxisGroup.selectAll('.domain').remove();

  xAxisOffset = 55
  svg.append('text')
      .attr('class', 'axisLabel')
      .attr('y', svgHeight + xAxisOffset)
      .attr('x', svgWidth/2)
      .attr('text-anchor', 'middle')
      .text("Time Interval");

  yScale = d3.scaleLinear()
    .domain([0, d3.max(dataArray, d => d.value)])
    .range([svgHeight, 0])

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

			console.log(dataArray)
			svg.selectAll("rect")
			.data(dataArray)
			.enter()
			.append("rect")
			.attr("class", "bars")
			.attr("x", d => xScale(d.date))
			.attr("y", d => yScale(d.value))
			.attr("height", d => svgHeight - yScale(d.value))
			.attr("width", xScale.bandwidth())
			.append("title")
				.text(d => "Date " + d.date + "\n" + "Steps: " + d.value)

		  console.log("Hello again")
			if (annotation){
					annotateStats()
				}

		brusher.call(brush)
		svg.on("dblclick",function(){
			 render(originalData, originalData[0], originalData.at(-1))
	    });

};

const updateChart = event => {
  extent = event.selection
	if (extent == null){
		return
	}
  selected =  xScale.domain().filter(d =>
             	(extent[0] - xScale.bandwidth() <= xScale(d))
							&& (xScale(d) <= extent[1]));
	render(dataArray, selected[0], selected.at(-1))
}

const annotateStats = () => {
  values = dataArray.map(d => d.value)
	valuesWithoutZero = values.filter(number => number != 0)
	min = d3.min(valuesWithoutZero)
	max= d3.max(values)
	avg = d3.mean(values)
	stats = new Map()
	stats.set("Minimum", min); stats.set("Maximum", max); stats.set("Average", avg)
	statsArray = Array.from(stats, ([title, stat]) => ({title, stat}));
	console.log(statsArray)

	const colors = ["rgb(61, 222, 77)", "rgb(240, 62, 28)", "rgb(254, 231, 24)"]
	var color = d3.scaleOrdinal()
		.domain(statsArray.map(d => d.title))
		.range(colors)

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

	console.log("There should be three annotations")
}

d3.csv(dataset).then(data =>{
    data.forEach(d => {
      d.Steps = +d.Steps;
      d.Time = d3.isoParse(d.Time)
      d.Hours = parseDateHours(d.Time)
      d.Days = parseDateDays(d.Time)
      d.Weeks = parseDateWeeks(d.Time)
      d.Months = parseDateMonths(d.Time)
    });
    nestedDataHours = d3.rollup(data, v => d3.sum(v,d => d.Steps), d => d.Hours)
    nestedDataDays = d3.rollup(data, v => d3.sum(v,d => d.Steps), d => d.Days)
    nestedDataWeeks = d3.rollup(data, v => d3.sum(v,d => d.Steps), d => d.Weeks)
    nestedDataMonths = d3.rollup(data, v => d3.sum(v,d => d.Steps), d => d.Months)

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

		var title = "Accumulated steps for every month"
		render(nestedDataMonths, nestedDataMonths[0], nestedDataMonths[-1], title)

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
