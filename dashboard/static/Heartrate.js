/***
 * @author Nadja Volkmann 
 ***/

// set svg dimensions and margins
const svgWidth = 800 ;
const svgHeight = 360;
const margin = {top: 20, right: 30, bottom: 50, left: 38};

// append the svg object to the body of the page
let svg = d3.select("#HRplot")
  .append("svg")
  .style('background-color', '#F8F8F8')
  .attr("width", svgWidth + margin.left + margin.right)
  .attr("height", svgHeight + margin.top + margin.bottom)
  .attr("class", "linechart")
  .append("g")
  .attr("transform","translate(" + margin.left + "," + margin.top + ")");

var parseTime = d3.timeParse("%Y-%m-%d %H:%M:00+00:00");

var rowConverter = function(d) {
    return {
        time: parseTime(d.Time),
        calories: parseFloat(d.Calories),
        hr: parseFloat(d.HR),
        temperature: parseFloat(d.Temperature),
        steps: parseFloat(d.Steps),
    };
}

  //load the data
  d3.csv(dataset, rowConverter).then(function(data) {
    console.log(data); 
    
    
    // Add X axis 
    var xScale = d3.scaleTime()
        .domain(d3.extent(data, function(d) {return d.time;}))
        .range([0, svgWidth]);
    xAxis = svg.append("g")
        .attr("transform", "translate(0," + svgHeight + ")")
        .call(d3.axisBottom(xScale));


    // Add Y axis
    var yScale = d3.scaleLinear()
        .domain([0, d3.max(data, function(d) {return +d.hr;})])
        .range([svgHeight, 0]);
    yAxis = svg.append("g")
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
        .extent( [ [0,0], [svgWidth,svgHeight] ] )  // brush area: start at (0,0), end at at (width,height)
        .on("end", updateChart)               // Each time the brush selection changes, trigger the 'updateChart' function

    // Create the line variable: where both the line and the brush take place
    var line = svg.append('g')
      .attr("clip-path", "url(#clip)")

    // Add the line
    line.append("path")
      .datum(data)
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "orange")
      .attr("stroke-width", 1)
      .attr("d", d3.line()
        .defined(function (d) { return d.hr ;})
        .x(function(d) { return xScale(d.time); })
        .y(function(d) { return yScale(d.hr); })
        )

    function time_start() { return String(xScale.domain()[0]).split(' ').slice(0,5).join(' ') }
    function time_end() { return String(xScale.domain()[1]).split(' ').slice(0,5).join(' ') }
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
      .call(brush);

    // A function that set idleTimeOut to null
    var idleTimeout
    function idled() { idleTimeout = null; }

    // A function that update the chart for given boundaries
    function updateChart({selection}) {

      // What are the selected boundaries?
      //extent = d3.event.selection

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
          .defined(function (d) { return d.hr ;})
          .x(function(d) { return xScale(d.time) })
          .y(function(d) { return yScale(d.hr) })
        )
    }

    // If user double clicks, reinitialize the chart
    svg.on("dblclick",function(){
      xScale.domain(d3.extent(data, function(d) { return d.time; }))
      xAxis.transition().call(d3.axisBottom(xScale))
      line
        .select('.line')
        .transition()
        .attr("d", d3.line()
          .defined(function (d) { return d.hr ;})
          .x(function(d) { return xScale(d.time) })
          .y(function(d) { return yScale(d.hr) })
      )
    });

  })