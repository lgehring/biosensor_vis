/***
 * @author Nadja Volkmann 
 ***/
/*** Inspired by: https://www.d3-graph-gallery.com/graph/line_brushZoom.html 
                  https://www.d3-graph-gallery.com/graph/line_cursor.html
                  https://www.d3-graph-gallery.com/graph/line_color_gradient_svg.html ***/



function lineplot(visparameter, divName, color, titleID) {

// units
const unitHR = " [BPM]"
const unitTemp = " [F]"

// set svg dimensions and margins - changed by Marit
const margin = {top: 20, right: 30, bottom: 40, left: 100};
const svgWidth = 800  - margin.left - margin.right;
const svgHeight = 360 - margin.top - margin.bottom;

// append the svg object to the body of the page
let svg = d3.select(divName)
  .append("svg")
  .style('background-color', 'white')
  .attr("width", svgWidth + margin.left + margin.right)
  .attr("height", svgHeight + margin.top + margin.bottom)
  .attr("class", "linechart")
  .append("g")
  .attr("transform","translate(" + margin.left + "," + margin.top + ")");

// parse the time
var parseTime = d3.timeParse("%Y-%m-%d %H:%M:00+00:00");  

// convert each value to correct datatype
var rowConverter = function(d) {
    return {
        Time: parseTime(d.Time),
        Calories: parseFloat(d.Calories),
        HR: parseFloat(d.HR),
        Temperature: parseFloat(d.Temperature),
        Steps: parseFloat(d.Steps),
    };
}

//load the data
d3.csv(dataset, rowConverter).then(function(data) {

  // Add X axis 
  var xScale = d3.scaleTime()
      .domain(d3.extent(data, function(d) {return d.Time;}))
      .range([0, svgWidth]);
  let xAxis = svg.append("g")
      .attr("transform", "translate(0," + svgHeight + ")")
      .call(d3.axisBottom(xScale));

  // max and min y-values
  const max = d3.max(data, function(d) {return +eval("d." + visparameter);})
  const min = d3.min(data, function(d) {return +eval("d." + visparameter);})
    
  // Add Y axis
  var yScale = d3.scaleLinear()
      .domain([min - 5, max])
      .range([svgHeight, 0]);
  let yAxis = svg.append("g")
      .call(d3.axisLeft(yScale));

  // set gradient 
  svg.append('linearGradient')
      .attr("id", "line-gradient")
      .attr("gradientUnits", "userSpaceOnUse")
      .attr("x1", 0)
      .attr("y1", yScale(min))
      .attr("x2", 0)
      .attr("y2", yScale(max))
      .selectAll("stop")
        .data([
          {offset: "0%", color: "blue"},
          {offset: "100%", color: color}
        ])
      .enter().append("stop")
        .attr("offset", function(d) {return d.offset})
        .attr("stop-color", function(d) { return d.color; });

  // Add a clipPath: everything out of this area won't be drawn.
  var clip = svg.append("defs").append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("width", svgWidth )
      .attr("height", svgHeight )
      .attr("x", 0)
      .attr("y", 0);

// Add brushing
  var brush = d3.brushX()                   // Add the brush feature using the d3.brush function
      .extent([[0,0], [svgWidth,svgHeight]])  // brush area: start at (0,0), end at at (width,height)
      .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

// Create the line variable: where both the line and the brush take place
  var line = svg.append('g')
    .attr("clip-path", "url(#clip)")

  // This allows to find the closest X index of the mouse:
  var bisect = d3.bisector(function(d) { return d.Time; }).left;

  // Create the circle that moves along line of the chart
  var focus = svg
    .append('g')
    .append('circle')
      .style("fill", "none")
      .attr("stroke", "black")
      .attr('r', 6)
      .style("opacity", 0)

  // Create the text that moves along line
  var focusText = d3.select(divName)
    .append('div')
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background-color", "black")
    .style("color", "white")
    .style("border", "none")
    .style("padding", "10px")

  // Add the line
  line.append("path")
  .datum(data)
  .attr("class", "line")
  .attr("fill", "none")
  .style("pointer-events", "all")
  .attr("stroke", "url(#line-gradient)")
  .attr("d", d3.line()
    .defined(function (d) { return eval("d." + visparameter) ;})
    .x(function(d) { return xScale(d.Time); })
    .y(function(d) { return yScale(eval("d." + visparameter)); }))

  // What happens when the mouse move -> show the annotations at the right positions
  function mouseover() {
    focus.style("opacity", 1)
    focusText.style("opacity",0.8)
  }

  function mousemove(event, d) {
    // get current x-coordinate
    var x0 = xScale.invert(d3.pointer(event, this)[0]-242-margin.left);
    var i = bisect(data, x0, 1),
    d0 = data[i - 1],
    d1 = data[i],
    d = x0 - d0.Time > d1.Time - x0 ? d1 : d0;

    // update the tooltip
    focus
      .attr("cx", xScale(d.Time))
      .attr("cy", yScale(eval("d." + visparameter)))
    focusText
      .text("x: " + String(d.Time).split(' ').slice(0,5).join(' ') + "  -  " + "y: \n" + eval("d." + visparameter))
      .style("left", (d3.pointer(event, this)[0]+20) + "px")
      .style("top", (d3.pointer(event, this)[1]+20) + "px")
    }

  // what happens when mouse leaves the line 
  function mouseout() {
    focus.style("opacity", 0)
    focusText.style("opacity", 0)
  }

  // Define date format
  let dateFormat = d3.timeFormat("%a %d.%m.%Y, %H:%M");

  // Set title
  document.getElementById(titleID).innerHTML = dateFormat(xScale.domain()[0].getTime()) + ' to ' + dateFormat(xScale.domain()[1].getTime())

  // get unit -- implemented by Marit
  function unit(param){
    unit = "";
    if(param == "HR"){
      unit = unitHR;
    } else if (param == "Temperature"){
      unit = unitTemp;
    }
    return unit;
  }

  // adds x-axis label - changed by Marit
  svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", svgWidth/2 + margin.left)
    .attr("y", svgHeight + margin.top + 10)
    .style("font-size", "14px")
    .style("font-family", "Arial")
    .text("Time");

  // adds y-axis label - changed by Marit
  svg.append("text")
    .attr("text-anchor", "end")
    .style("font-size", "14px")
    .style("font-family", "Arial")
    .attr("transform", "rotate(-90)")
    .attr("y", -margin.left/2.8)
    .attr("x", -margin.top )
    .text(visparameter+ unit(visparameter));
  
  // Add the brushing
  line
  .append("g")
    .attr("class", "brush")
    .on('mouseover', mouseover)
    .on('mousemove', (event,d) => {mousemove(event,d)})
    .on('mouseout', mouseout)
    .call(brush);

  // A function that set idleTimeOut to null
  var idleTimeout
  function idled() { idleTimeout = null; }

  // A function that update the chart for given boundaries
  function updateChart({selection}) {

    // If no selection, back to initial coordinate. Otherwise, update X axis domain
    if(!selection){ 
      if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // Executes idled() after 350 ms
      xScale.domain([ 4,8])
    }else{
      xScale.domain([ xScale.invert(selection[0]), xScale.invert(selection[1]) ])
      line.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
    }
  // Update axis and line 
  xAxis.transition().duration(500).call(d3.axisBottom(xScale))
  document.getElementById(titleID).innerHTML = dateFormat(xScale.domain()[0].getTime()) + ' to ' + dateFormat(xScale.domain()[1].getTime())

  line
      .select('.line')
      .transition()
      .duration(500)
      .attr("d", d3.line()
        .defined(function (d) { return eval("d." + visparameter) ;})
        .x(function(d) { return xScale(d.Time) })
        .y(function(d) { return yScale(eval("d." + visparameter)) }))
  }

  // If user double clicks, reinitialize the chart
  svg.on("dblclick",function(){
    xScale.domain(d3.extent(data, function(d) { return d.Time; }))
    xAxis.transition().call(d3.axisBottom(xScale))
    line
      .select('.line')
      .transition()
      .attr("d", d3.line()
        .defined(function (d) { return eval("d." + visparameter) ;})
        .x(function(d) { return xScale(d.Time) })
        .y(function(d) { return yScale(eval("d." + visparameter)) })
    )
  });
})
}









  


    

    
      
    
    


