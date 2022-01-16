


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
        console.log(cols)

        // create the correlation matrix for the variables: Calories, HR, Temperature, Steps
        var stats = new Statistics(data, columns);
        var corr_matrix = [...Array(cols.length - 1)].map(e => Array(cols.length - 1));
        for (let i=1; i < cols.length; i++){
            for (let j=i; j < cols.length; j++) {
                console.log(cols[i], cols[j]);
                var r = stats.correlationCoefficient(cols[i], cols[j]);
                corr_matrix[i-1][j-1] = Math.abs(r.correlationCoefficient);
                corr_matrix[j-1][i-1] = Math.abs(r.correlationCoefficient);
            }
        }
        console.log(corr_matrix) 


        // specify colors for each variable in chord graph 
        var colors = [ "orange", "red", "pink", "purple"]
        // create the svg area
        var svg = d3.select(divName)
            .append("svg")
            .attr("width", 480)
            .attr("height", 480)
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
            .style("stroke", "black");
        
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
            console.log(d3.range(0, d.value, step).map(function(value) {
                return {value: value, angle: value * k + d.startAngle};
                }))

            return d3.range(0, d.value, step).map(function(value) {
            return {value:  Math.round(value * 10) /10 , angle: value * k + d.startAngle};
            });
        }

        // Add the ticks
        group
            .selectAll(".group-tick")
            .data(function(d) { return groupTicks(d, 0.2); })    // Controls the number of ticks: one tick each 25 here.
            .enter()
            .append("g")
            .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + 200 + ",0)"; })
            .append("line")               // By default, x1 = y1 = y2 = 0, so no need to specify it.
            .attr("x2", 10)
            .attr("stroke", "black")

        // Add the labels of a few ticks:
        group
            .selectAll(".group-tick-label")
            .data(function(d) { return groupTicks(d, 0.2); })
            .enter()
            //.filter(function(d) { return d.value % 0.2 === 0; })
            .append("g")
            .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + 205 + ",0)"; })
            .append("text")
            .attr("x", 8)
            .attr("dy", ".35em")
            .attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180) translate(-16)" : null; })
            .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
            .text(function(d) { return d.value })
            .style("font-size", 10)
        

    })
}
