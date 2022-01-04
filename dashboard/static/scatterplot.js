/***
 * @author Lukas Gehring
 * based on: https://www.d3-graph-gallery.com/graph/scatter_tooltip.html and
 * https://www.d3-graph-gallery.com/graph/interactivity_brush.html#realgraph
 ***/
// Visualizes the given parameter by uniformly sampling the given number of dots.
// Zooming is possible via brushing. When double clicking, zoom out and resample.
// Enter name of visparameter as given in the CSV Header
function scatterplot(visparameter, divName, sampleSize) {
    // Set the dimensions and margins of the graph
    const margin = {top: 10, right: 30, bottom: 30, left: 60}, width = 1200 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

    // Append the svg object to the body of the page
    const svg = d3.select(divName)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Read data
    d3.csv(dataset).then(function (data) {
        // Preprocess --------------------------------------------------------------------------
        function toNumber(d) {
            if (d != '') {
                return +d
            } else {
                return null
            }
        }

        // Read in as correct datatypes
        data.forEach(function (d) {
            d.Time = d3.isoParse(d.Time);
            d.Calories = toNumber(d.Calories);
            d.HR = toNumber(d.HR);
            d.Temperature = toNumber(d.Temperature);
            d.Steps = toNumber(d.Steps);
        });

        // Find max HR + min/max Time
        const maxVis = d3.max(data, function (d) {
            return eval("d." + visparameter);
        });
        let minTime = d3.min(data, function (d) {
            return d.Time;
        });
        let maxTime = d3.max(data, function (d) {
            return d.Time;
        });
        // --------------------------------------------------------------------------

        // Add X axis
        const x = d3.scaleTime()
            .domain([minTime, maxTime])
            .range([0, width]);
        let xAxis = svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([0, maxVis])
            .range([height, 0]);
        let yAxis = svg.append("g")
            .call(d3.axisLeft(y));

        // Add a clipPath: everything out of this area won't be drawn.
        var clip = svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", width)
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0);

        // Add a tooltip div
        const tooltip = d3.select("#hrDiv")
            .append("div")
            .style("position", "absolute")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")

        // Adjust tooltip per dot
        const mouseover = function (event, d) {
            tooltip
                .style("opacity", 1)
        }

        const mousemove = function (event, d) {
            tooltip
                .html(eval("d." + visparameter) + ' | ' + d.Time)
                .style("left", (event.x + 20) + "px") // It is important to put the +90: other wise the tooltip is exactly where the point is an it creates a weird effect
                .style("top", (event.y - 10) + "px")
        }

        const mouseleave = function (event, d) {
            tooltip
                .style("opacity", 0)
        }

        // Add brushing
        var brush = d3.brushX() // Add the brush feature using the d3.brush function
            .extent([[0, 0], [width, height]]) // initialise the brush area: start at 0,0 and finishes at width,height: it means I select the whole graph area
            .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

        // Create the scatter variable: where both the circles and the brush take place
        var scatter = svg.append('g')
            .attr("clip-path", "url(#clip)")

        // Add the brushing
        scatter
            .append("g")
            .attr("class", "brush")
            .call(brush);

        let selection = Array.from({length: sampleSize}, () => Math.floor(Math.random() * data.length));

        // Add dots
        scatter
            .selectAll("dot")
            .data(data.filter(function (d, i) {
                if (selection.includes(i) && eval("d." + visparameter) != null) {
                    return i
                }
            }))
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return x(d3.isoParse(d.Time));
            })
            .attr("cy", function (d) {
                return y(eval("d." + visparameter));
            })
            .attr("r", 3)
            .style("fill", "red")
            .style("opacity", 0.3)
            .style("stroke", "white")
            .on("mouseover", mouseover)
            .on("mousemove", mousemove)
            .on("mouseleave", mouseleave)

        // A function that set idleTimeOut to null
        var idleTimeout

        function idled() {
            idleTimeout = null;
        }

        // A function to round dates to the nearest x minutes
        let getRoundedDate = (minutes, d = new Date()) => {

            let ms = 1000 * 60 * minutes; // convert minutes to ms
            let roundedDate = new Date(Math.round(d.getTime() / ms) * ms);

            return roundedDate
        }

        // A function that update the chart for given boundaries
        function updateChart(event) {

            extent = event.selection
            let selectionCombined = selection.slice()

            // If no selection, back to initial coordinate. Otherwise, update X axis domain
            if (!extent) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                x.domain([minTime, maxTime])
                scatter
                    .selectAll("circle")
                    .remove()
                // Add dots
                scatter
                    .selectAll("dot")
                    .data(data.filter(function (d, i) {
                        if (selection.includes(i) && eval("d." + visparameter) != null) {
                            return i
                        }
                    }))
                    .enter()
                    .append("circle")
                    .attr("cx", function (d) {
                        return x(d3.isoParse(d.Time));
                    })
                    .attr("cy", function (d) {
                        return y(eval("d." + visparameter));
                    })
                    .attr("r", 3)
                    .style("fill", "red")
                    .style("opacity", 0.3)
                    .style("stroke", "white")
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .on("mouseleave", mouseleave)
            } else {
                // Snap brush to full minute
                x.domain([getRoundedDate(1, x.invert(extent[0])), getRoundedDate(1, x.invert(extent[1]))])
                scatter.select(".brush").call(brush.move, null) // This remove the grey brush area as soon as the selection has been done
                // New dots
                const minTimeEqual = (element) => element.Time.getTime() == x.domain()[0].getTime();
                const maxTimeEqual = (element) => element.Time.getTime() == x.domain()[1].getTime();
                minTimeInd = data.findIndex(minTimeEqual)
                maxTimeInd = data.findIndex(maxTimeEqual)
                let timeIndDiff = maxTimeInd - minTimeInd

                // Substract the nuber of already plotted dots from the number of dots to add
                function isInbetween(ind, element) {
                    return ind[0] < element  && element < ind[1] && eval("data[element]." + visparameter) != null;
                }

                let sampleSizeNew = sampleSize - selectionCombined.filter(isInbetween.bind(this, [minTimeInd, maxTimeInd])).length
                let selectionNew = Array.from({length: sampleSizeNew}, () => Math.floor(Math.random() * timeIndDiff + minTimeInd));
                selectionCombined = [...selection, ...selectionNew];
                scatter
                    .selectAll("dot")
                    .data(data.filter(function (d, i) {
                        if (selectionNew.includes(i) && eval("d." + visparameter) != null) {
                            return i
                        }
                    }))
                    .enter()
                    .append("circle")
                    .attr("cx", function (d) {
                        return x(d3.isoParse(d.Time));
                    })
                    .attr("cy", function (d) {
                        return y(eval("d." + visparameter));
                    })
                    .attr("r", 3)
                    .style("fill", "red")
                    .style("opacity", 0.3)
                    .style("stroke", "white")
                    .on("mouseover", mouseover)
                    .on("mousemove", mousemove)
                    .on("mouseleave", mouseleave)
            }
            // Update axis and circle position
            xAxis.transition().duration(1000).call(d3.axisBottom(x))
            scatter
                .selectAll("circle")
                .transition().duration(1000)
                .attr("cx", function (d) {
                    return x(d3.isoParse(d.Time));
                })
                .attr("cy", function (d) {
                    return y(eval("d." + visparameter));
                })
        }
    })
}