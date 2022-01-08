const buttonMonth_div = document.getElementById("ButtonMonth");
const buttonWeek_div = document.getElementById("ButtonWeek");
const buttonDay_div = document.getElementById("ButtonDay");
const buttonHour_div = document.getElementById("ButtonHour");

// Helping functions:
var parseDateHours = d3.timeFormat("%d/%m/%Y %H");
var parseDateDays = d3.timeFormat("%d/%m/%Y");
var parseDateWeeks = d3.timeFormat("%b/%Y %H");
var parseDateMonths = d3.timeFormat("%m/%Y");

// set svg dimensions and margins
const svgWidth = 1400;
const svgHeight = 800;
const margin = {top: 110, right: 100, bottom: 150, left: 100};

// append the svg object to the body of the page
let svg = d3.select("#barChart")
  .append("svg")
  .attr("width", svgWidth + margin.left + margin.right)
  .attr("height", svgHeight + margin.top + margin.bottom)
  .attr("class", "chart")
const g =  svg.append("g")


const render = data => {
  dataArray = Array.from(data, ([date, value]) => ({ date, value }));
//  monthArray = Array.from(months,  ([date, value]) => ({ date, value }));

  const xScale = d3.scaleTime()
    .domain(d3.extent(dataArray))
    .range([0, svgWidth])


  const xAxis = d3.axisBottom(xScale)
      .ticks(12)
  const xAxisGroup = g.append('g')
    .attr("transform", `translate(0, ${svgHeight})`)
    .call(xAxis)


  const yScale = d3.scaleLinear()
    .domain([0, d3.max(dataArray, d => d.value)])
    .range([svgHeight, 0])

    svg.selectAll("rect")
    .data(dataArray)
    .enter()
    .append("rect")
    .attr("x", d => xScale(d.date))
    .attr("y", d => yScale(d.value))
    .attr("height", d => svgHeight - yScale(d.value))
    .attr("width", xScale.bandwidth());
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
