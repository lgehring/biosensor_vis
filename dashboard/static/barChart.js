// TODO:
// Brushing
// Annotations
// Styling
// Comments
// Function of script

const buttonMonth_div = document.getElementById("ButtonMonth");
const buttonWeek_div = document.getElementById("ButtonWeek");
const buttonDay_div = document.getElementById("ButtonDay");
const buttonHour_div = document.getElementById("ButtonHour");

// Helping functions:
var parseDateHours = d3.timeFormat("%d/%m/%Y %H:00");
var parseDateDays = d3.timeFormat("%d/%m/%Y");
var parseDateWeeks = d3.timeFormat("CW %U/%Y");
var parseDateMonths = d3.timeFormat("%b %Y");

function getTickArray(dataArray){
		if (dataArray.length <= 5) {
			console.log(dataArray.map(d => d.date))
			return dataArray.map(d => d.date)
		}
    const indicesBetweenPoints = Math.round(dataArray.length/12)
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
	endIndex = 0;
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
const margin = {top: 10, right: 30, bottom: 50, left: 75}

// append the svg object to the body of the page
let svg = d3.select("#barChart")
  .append("svg")
  .attr("width", svgWidth + margin.left + margin.right)
  .attr("height", svgHeight + margin.top + margin.bottom)
  .attr("class", "chart")
  .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

const render = (data, startDate, endDate) => {
	svg.selectAll('*').remove();
	if(data.constructor === Array){
		data = dataArray
		dataArray = cutArray(dataArray, startDate, endDate)
		console.log(dataArray)
	} else {
		dataArray = Array.from(data, ([date, value]) => ({ date, value }));
		originalData = dataArray.slice() //copies the array, so when used double clicks, this can be drawn
	}

  xScale = d3.scaleBand()
    .domain(dataArray.map(d => d.date))
    .range([0, svgWidth])

  const ticks = getTickArray(dataArray)

  const xAxis = d3.axisBottom(xScale)
      .tickValues(ticks)
			.tickSizeOuter(0)
  const xAxisGroup = svg.append('g')
    .attr("transform", `translate(0, ${svgHeight})`)
    .call(xAxis)
  //xAxisGroup.selectAll('.domain').remove();

  xAxisOffset = 40
  svg.append('text')
      .attr('class', 'axisLabel')
      .attr('y', svgHeight + xAxisOffset)
      .attr('x', svgWidth/2)
      .attr('text-anchor', 'middle')
      .text("Time Interval");

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(dataArray, d => d.value)])
    .range([svgHeight, 0])

  const yAxis = d3.axisLeft(yScale)
    .tickSizeOuter(0)
  const yAxisGroup = svg.append('g')
    .call(yAxis)

  yAxisOffset = -60
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

    svg.selectAll("rect")
    .data(dataArray)
    .enter()
    .append("rect")
    .attr("x", d => xScale(d.date))
    .attr("y", d => yScale(d.value))
    .attr("height", d => svgHeight - yScale(d.value))
    .attr("width", xScale.bandwidth())
    .append("title")
      .text(d => "Time Interval: " + d.date + "\n" + "Steps: " + d.value)


    // Add brushing
    brush = d3.brushX()
      .extent([[0,0], [svgWidth,svgHeight]])
      .on("end", updateChart)

    const brusher = svg.append("g")
      .call(brush)

};

const updateChart = event => {
	setTimeout(() => {  console.log("Updating..."); }, 20000);
  extent = event.selection
	if (extent == null){
		return
	}
  selected =  xScale.domain().filter(d =>
             	(extent[0] - xScale.bandwidth() <= xScale(d))
							&& (xScale(d) <= extent[1]));
	render(dataArray, selected[0], selected.at(-1))
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

    buttonHour_div.addEventListener("click", function(){
        render(nestedDataHours, nestedDataHours[0], nestedDataHours[-1])
    })

    buttonDay_div.addEventListener("click", function(){
        render(nestedDataDays, nestedDataDays[0], nestedDataDays[-1])
    })

    buttonWeek_div.addEventListener("click", function(){
        render(nestedDataWeeks, nestedDataWeeks[0], nestedDataWeeks[-1])
    })

    buttonMonth_div.addEventListener("click", function(){
        render(nestedDataMonths, nestedDataMonths[0], nestedDataMonths[-1])
    })

  })
