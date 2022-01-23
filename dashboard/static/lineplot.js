/***
 * @author Nadja Volkmann 
 ***/
/*** Inspired by: https://www.d3-graph-gallery.com/graph/line_brushZoom.html 
                  https://www.d3-graph-gallery.com/graph/line_cursor.html ***/

//testtest

function lineplot(visparameter, divName, color) {

// set svg dimensions and margins
const svgWidth = 800 ;
const svgHeight = 360;
const margin = {top: 20, right: 30, bottom: 50, left: 50};

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
  console.log(data); 
  console.log(data[d3.maxIndex(data, d => d.Steps)])
  
  // Add X axis 
  var xScale = d3.scaleTime()
      .domain(d3.extent(data, function(d) {return d.Time;}))
      .range([0, svgWidth]);
  let xAxis = svg.append("g")
      .attr("transform", "translate(0," + svgHeight + ")")
      .call(d3.axisBottom(xScale));

  // Add Y axis
  var yScale = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) {return +eval("d." + visparameter);})])
      .range([svgHeight, 0]);
  let yAxis = svg.append("g")
      .call(d3.axisLeft(yScale));

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
      .attr('r', 4)
      .style("opacity", 0)

  // Create the text that moves along line
  var focusText = d3.select(divName)
    .append('div')
    .style("position", "absolute")
    .style("opacity", 0)
    .style("background-color", "white")
    .style("border", "none")
    .style("border-radius", "7px")
    .style("padding", "10px")

  // Add the line
  line.append("path")
  .datum(data)
  .attr("class", "line")
  .attr("fill", "none")
  .style("pointer-events", "all")
  .attr("stroke", color)
  .attr("opacity", 0.8)
  .attr("stroke-width", 1)
  .attr("d", d3.line()
    .defined(function (d) { return eval("d." + visparameter) ;})
    .x(function(d) { return xScale(d.Time); })
    .y(function(d) { return yScale(eval("d." + visparameter)); }))


  // What happens when the mouse move -> show the annotations at the right positions
  function mouseover() {
    focus.style("opacity", 1)
    focusText.style("opacity",1)
  }

  function mousemove(event, d) {
    // get current x-coordinate
    var x0 = xScale.invert(d3.pointer(event, this)[0]-242-margin.left);
    console.log(d3.pointer(event, this)[0]);
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


  function time_start() { return String(xScale.domain()[0]).split(' ').slice(0,5).join(' ') }
  function time_end() { return String(xScale.domain()[1]).split(' ').slice(0,5).join(' ') }

  // adds x-axis label 
  svg.append("text")
    .attr("class", "xLabel")
    .attr("text-anchor", "end")
    .attr("x", svgWidth)
    .attr("y", svgHeight + margin.top + 20)
    .text(time_start() + " - " + time_end());

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
      //console.log(xScale.domain());
      line.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
    }
  // Update axis and line 
  xAxis.transition().duration(500).call(d3.axisBottom(xScale))
  //newWidth = d3.select(".line").style("stroke-width") + 0.5
  svg.select('.xLabel').text(time_start() + " - " + time_end());

  line
      .select('.line')
      //.attr("stroke-width", newWidth)
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









  


    

    
      
    
    


