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

function updateChart(){
  console.log("Updating chart")
}
const render = data => {
  dataArray = Array.from(data, ([date, value]) => ({ date, value }));
//  monthArray = Array.from(months,  ([date, value]) => ({ date, value }));

  const xScale = d3.scaleBand()
    .domain(dataArray.map(d => d.date))
    .range([0, svgWidth])

  const ticks = getTickArray(dataArray)

  const xAxis = d3.axisBottom(xScale)
      .tickValues(ticks)
  const xAxisGroup = svg.append('g')
    .attr("transform", `translate(0, ${svgHeight})`)
    .call(xAxis)
  xAxisGroup.selectAll('.domain').remove();

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

  console.log("The axes should have titles")
};

d3.csv(dataset).then(data =>{
    data.forEach(d => {
      d.Steps = +d.Steps;
      d.Time = d3.isoParse(d.Time)
      d.Hours = parseDateHours(d.Time)
      d.Days = parseDateDays(d.Time)
      d.Weeks = parseDateWeeks(d.Time)
      d.Months = parseDateMonths(d.Time)
    });
    nestedDataHours = d3.rollup(data,  v => d3.sum(v, d => d.Steps), d => d.Hours)
    nestedDataDays = d3.rollup(data,  v => d3.sum(v, d => d.Steps), d => d.Days)
    nestedDataWeeks = d3.rollup(data,  v => d3.sum(v, d => d.Steps), d => d.Weeks)
    nestedDataMonths = d3.rollup(data,  v => d3.sum(v, d => d.Steps), d => d.Months)

    buttonHour_div.addEventListener("click", function(){
        svg.selectAll('*').remove();
        render(nestedDataHours)
    })

    buttonDay_div.addEventListener("click", function(){
        svg.selectAll('*').remove();
        render(nestedDataDays)
    })

    buttonWeek_div.addEventListener("click", function(){
        svg.selectAll('*').remove();
        render(nestedDataWeeks)
    })

    buttonMonth_div.addEventListener("click", function(){
        svg.selectAll('*').remove();
        render(nestedDataMonths)
    })

  })
