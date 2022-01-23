/***
 * @author Nadja Volkmann 
 ***/
/*** Inspired by: https://www.d3-graph-gallery.com/graph/chord_axis_labels.html 
 ***/


function chordgraph(divName) {
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

    d3.csv(dataset, rowConverter).then(function(data) {
        console.log(data); 
        console.log(data[d3.maxIndex(data, d => d.Steps)])
        cols = data.columns
        var columns = {
            Time: 'interval',
            Calories: 'metric',
            HR: 'interval',
            Temperature: 'interval',
            Steps: 'metric'
        };

        // create the correlation matrix for the variables: Calories, HR, Temperature, Steps
        var stats = new Statistics(data, columns);
        var corr_matrix = [...Array(cols.length - 1)].map(e => Array(cols.length - 1));
        for (let i=1; i < cols.length; i++){
            for (let j=i; j < cols.length; j++) {
                var r = stats.correlationCoefficient(cols[i], cols[j]);
                corr_matrix[i-1][j-1] = Math.abs(r.correlationCoefficient);
                corr_matrix[j-1][i-1] = Math.abs(r.correlationCoefficient);
            }
        }
        console.log(corr_matrix) 


        // specify colors for each variable in chord graph 
        var colors = ["#00963c", "#e0432f", "#EB8015", "#245d96"]
        // create the svg area
        var svg = d3.select(divName)
            .append("svg")
            .attr("width", 600)
            .attr("height", 600)
            .append("g")
            .attr("transform", "translate(240,240)")

        var res = d3.chord()
            .padAngle(0.05)
            .sortSubgroups(d3.descending)
            (corr_matrix)

        
        // Add the links between groups
        svg
            .datum(res)
            .append("g")
            .selectAll("path")
            .data(function(d) { return d; })
            .enter()
            .append("path")
            .attr("d", d3.ribbon()
                .radius(190)
            )
            .style("fill", function(d){ return(colors[d.source.index]) })
            .style("stroke", "black")
            .style("opacity", 0.6)
            .attr("class", function(d) { return "var " + cols[d.source.index +1] + " " + cols[d.target.index +1]})
            .append("title")
				.text(d => cols[d.source.index + 1] + " to " + cols[d.target.index + 1] + "\n" + "R: " + corr_matrix[d.source.index][d.target.index])
        
        // add the groups on the inner part of the circle
        var group = svg
            .datum(res)
            .append("g")
            .selectAll("g")
            .data(function(d) { return d.groups; })
            .enter()
            
        group.append("g")
            .append("path")
                .style("fill", "grey")
                .style("stroke", "black")
                .attr("d", d3.arc() 
                    .innerRadius(190)
                    .outerRadius(200)
                    )
        // Returns an array of tick angles and values for a given group and step.
        function groupTicks(d, step) {
            var k = (d.endAngle - d.startAngle) / d.value;
            return d3.range(0, d.value, step).map(function(value) {
            return {value:  Math.round(value * 10) /10 , angle: value * k + d.startAngle};
            });
        }

        // Return angle for label 
        function groupLabel(d) {
            console.log(d);
            var k = (d.endAngle - d.startAngle) / d.value;
            console.log({value:  Math.round(d.value/2 * 10) /10 , angle: d.value * k + d.startAngle, name: cols[d.index + 1]});
            return [{value:  Math.round(d.value/2 * 10) /10 , angle: d.value/2 * k + d.startAngle, name: cols[d.index + 1]}];
        }

        // Add the ticks
        group
            .selectAll(".cg-group-tick")
            .data(function(d) { return groupTicks(d, 0.2); })    // Controls the number of ticks: one tick each 25 here.
            .enter()
            .append("g")
            .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + 200 + ",0)"; })
            .append("line")               // By default, x1 = y1 = y2 = 0, so no need to specify it.
            .attr("x2", 10)
            .attr("stroke", "black")
            

        // Add the labels of a few ticks:
        group
            .selectAll(".cg-group-tick-labels")
            .data(function(d) { return groupTicks(d, 0.2); })
            .enter()
            //.filter(function(d) { return d.value % 0.2 === 0; })
            .append("g")
            .attr("class", "cg-tick-labels")
            .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + 205 + ",0)"; })
            .append("text")
            .attr("x", 8)
            .attr("dy", ".35em")
            .attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180) translate(-16)" : null; })
            .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
            .text(function(d) { return d.value })
            .style("font-size", 12)

        
        // highlights correlations for selected variable 
        var highlightVariable = function(event, d) {
            d3.selectAll(".var").style("opacity", 0.1)
            d3.selectAll("." + cols[d.index + 1]).style("opacity", 1)
        }

        // highlights all correlations 
        var highlightAll = function(event, d) {
            d3.selectAll(".var").style("opacity", 0.6)
        }

        var names = ['Calories', 'Heartrate', 'Temperature', 'Steps']
        // add variable names as titles
        group.append("svg:text")
            .each(function(d) { d.angle = (d.startAngle + d.endAngle) / 2; })
            .attr("dy", ".35em")
            .attr("class", "cg-titles")
            .attr("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
            .attr("transform", function(d) {
		        return "rotate(" + (d.angle * 180 / Math.PI - 90) + ")"
		            + "translate(" + (190 + 55) + ")"
		            + (d.angle > Math.PI ? "rotate(180)" : "");
                })
            .attr('opacity', 1)
            .text(function(d) { console.log(names[d.index]); return names[d.index]; })
            .style("font-size", 20)
            .on("mouseover", (event, d) => {highlightVariable(event, d)})
            .on("mouseout", (event,d) => {highlightAll(event, d)})
        
    })
}
