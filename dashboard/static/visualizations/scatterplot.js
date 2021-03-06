/***
 * @author Lukas Gehring
 * based on: https://www.d3-graph-gallery.com/graph/scatter_tooltip.html and
 * https://www.d3-graph-gallery.com/graph/interactivity_brush.html#realgraph
 ***/

// Visualizes the given parameter by uniformly sampling the given number of dots.
// Zooming is possible via brushing. When double clicking, zoom out and reset dotcount.
// Enter name of visparameter as given in the CSV Header and dotcolor as a string.
// Optionally takes a start and end date for initial zoom window as datetime objects.
function scatterplot(visparameter, divName, titleID, dotcolor, sampleSize, start = null, end = null) {
    const margin = {top: 20, right: 30, bottom: 40, left: 100}, width = 800 - margin.left - margin.right, 
    height = 360 - margin.top - margin.bottom;

    const svg = d3.select('#' + divName)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // A function to round dates to the nearest x minutes
    let getRoundedDate = (minutes, d = new Date()) => {
        let ms = 1000 * 60 * minutes; // convert minutes to ms
        let roundedDate = new Date(Math.round(d.getTime() / ms) * ms);
        return roundedDate
    }

    // Read and process data
    d3.csv(dataset).then(function (data) {
        // Preprocess data ----------------------------------------------------------
        // Converts strings from the CSV to number or null
        function toNumber(d) {
            if (d != '') {
                return +d
            } else {
                return null
            }
        }

        // Read data and convert to correct type
        data.forEach(function (d) {
            d.Time = d3.isoParse(d.Time);
            d.Calories = toNumber(d.Calories);
            d.HR = toNumber(d.HR);
            d.Temperature = toNumber(d.Temperature);
            d.Steps = toNumber(d.Steps);
        });

        // Find min/max HR + Time
        const maxVis = d3.max(data, function (d) {
            return eval("d." + visparameter);
        });
        const minVis = d3.min(data, function (d) {
            return eval("d." + visparameter);
        });
        let minTime = d3.min(data, function (d) {
            return d.Time;
        });
        let maxTime = d3.max(data, function (d) {
            return d.Time;
        });

        // Initial axis limits
        let minTimeTemp = minTime
        let maxTimeTemp = maxTime

        // Set new initial axis limits, if given
        if (start != null && end != null && start >= minTime && end <= maxTime) {
            // Round to nearest minute
            start = getRoundedDate(1, start)
            end = getRoundedDate(1, end)
            minTimeTemp = start
            maxTimeTemp = end
        }
        // --------------------------------------------------------------------------

        // Add X axis
        const x = d3.scaleTime()
            .domain([minTimeTemp, maxTimeTemp])
            .range([0, width]);
        let xAxis = svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x));

        // Add Y axis
        const y = d3.scaleLinear()
            .domain([minVis, maxVis])
            .range([height, 0]);
        let yAxis = svg.append("g")
            .call(d3.axisLeft(y));

        // Units - added by Marit
        const unitHR = " [BPM]"
        const unitTemp = " [F]"

        // Get unit - implemented by Marit
        function unit(param) {
            unit = "";
            if (param == "HR") {
                unit = unitHR;
            } else if (param == "Temperature") {
                unit = unitTemp;
            }
            return unit;
        }

        // Add X-axis label - modified by Marit
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("x", width / 2 + margin.left)
            .attr("y", height + margin.top + 20)
            .style("font-size", "14px")
            .style("font-family", "Arial")
            .text("Time");

        // Add Y-axis label - modified by Marit
        svg.append("text")
            .attr("text-anchor", "end")
            .style("font-size", "14px")
            .style("font-family", "Arial")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left / 2)
            .attr("x", -margin.top)
            .text(visparameter + unit(visparameter));


        // Add a clipPath: everything out of this area won't be drawn.
        var clip = svg.append("defs").append("svg:clipPath")
            .attr("id", "clip")
            .append("svg:rect")
            .attr("width", width)
            .attr("height", height)
            .attr("x", 0)
            .attr("y", 0);

        // Add a tooltip div
        const tooltip = d3.select(divName)
            .append("div")
            .style("position", "absolute")
            .style("opacity", 0)
            .attr("class", "tooltip")
            .style("background-color", "white")
            .style("border", "solid")
            .style("border-width", "1px")
            .style("border-radius", "5px")
            .style("padding", "10px")

        // Add brushing
        var brush = d3.brushX()
            .extent([[0, 0], [width, height]])
            .on("end", updateChart) // Each time the brush selection changes, trigger the 'updateChart' function

        // Create the scatter variable: where both the circles and the brush take place
        var scatter = svg.append('g')
            .attr("clip-path", "url(#clip)")

        // Add the brushing
        scatter
            .append("g")
            .attr("class", "brush")
            .call(brush);

        // Uniformly sample the given number of datapoints
        let selection = Array.from({length: sampleSize}, () => Math.floor(Math.random() * data.length));
        let origSampleSize = sampleSize

        // Define date format
        let dateFormat = d3.timeFormat("%a %d.%m.%Y, %H:%M");

        // Set the title
        document.getElementById(titleID).innerHTML = dateFormat(x.domain()[0].getTime()) + ' to ' + dateFormat(x.domain()[1].getTime())

        // Define dotPlotting function and add dots
        function plotDots(filterFunction) {
            scatter
                .selectAll("dot")
                .data(data.filter(filterFunction))
                .enter()
                .append("circle")
                .attr("cx", function (d) {
                    return x(d3.isoParse(d.Time));
                })
                .attr("cy", function (d) {
                    return y(eval("d." + visparameter));
                })
                .attr("r", 3)
                .style("fill", dotcolor)
                .style("opacity", 0.5)
                .style("stroke", "white")
                .append("title")
                .text(d => dateFormat(d.Time) + "\n" + visparameter + ": " + eval("d." + visparameter))
        }

        // Define filter function for dot plotting
        const selectionIncludes = function (d, i) {
            if (selection.includes(i) && eval("d." + visparameter) != null) {
                return i
            }
        }
        plotDots(selectionIncludes)

        // A function that sets idleTimeOut to null
        var idleTimeout

        function idled() {
            idleTimeout = null;
        }

        // Initialize the new brush selection sample
        selectionCombined = selection.slice()

        // A function that updates the chart for given boundaries
        function updateChart(event) {
            extent = event.selection

            // If no selection, back to initial coordinate. Otherwise, update X axis domain
            if (!extent) {
                if (!idleTimeout) return idleTimeout = setTimeout(idled, 350); // This allows to wait a little bit
                x.domain([minTime, maxTime])
                scatter
                    .selectAll("circle")
                    .remove()
                document.getElementById('sampleSize').setAttribute("min", origSampleSize);
                document.getElementById('range').innerHTML = 'Enter number of dots to sample (' + origSampleSize + '-10,000):'
                sampleSize = origSampleSize
                selectionCombined = selection.slice()

                // Add dots
                plotDots(selectionIncludes)
            } else {
                // Snap brush to full minute
                x.domain([getRoundedDate(1, x.invert(extent[0])), getRoundedDate(1, x.invert(extent[1]))])
                scatter.select(".brush").call(brush.move, null)

                // New dots
                const minTimeEqual = (element) => element.Time.getTime() == x.domain()[0].getTime();
                const maxTimeEqual = (element) => element.Time.getTime() == x.domain()[1].getTime();
                minTimeInd = data.findIndex(minTimeEqual)
                maxTimeInd = data.findIndex(maxTimeEqual)
                let timeIndDiff = Math.abs(maxTimeInd - minTimeInd)

                // Substract the nuber of already plotted dots from the number of dots to add
                function isInbetween(ind, element) {
                    return ind[0] < element && element < ind[1] && eval("data[element]." + visparameter) != null;
                }

                // Update sampled datapoints
                let sampleSizeNew = sampleSize - selectionCombined.filter(isInbetween.bind(this, [minTimeInd, maxTimeInd])).length
                let selectionNew = Array.from({length: sampleSizeNew}, () => Math.floor(Math.random() * timeIndDiff + minTimeInd));
                selectionCombined = [...selectionCombined, ...selectionNew];

                // Define new filter function
                const selectionNewIncludes = function (d, i) {
                    if (selectionNew.includes(i) && eval("d." + visparameter) != null) {
                        return i
                    }
                }
                plotDots(selectionNewIncludes)
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

            // Update the title
            document.getElementById(titleID).innerHTML = dateFormat(x.domain()[0].getTime()) + ' to ' + dateFormat(x.domain()[1].getTime())
        }

        // A function that updates the sampleSize
        d3.select("#submit")
            .on("click", function () {
                let newSampleSize = document.getElementById('sampleSize').value
                if (toNumber(newSampleSize) > toNumber(sampleSize)) {
                    // Update sampleSize in input field
                    sampleSize = newSampleSize
                    document.getElementById('sampleSize').value = ''
                    document.getElementById('sampleSize').setAttribute("min", newSampleSize);
                    document.getElementById('range').innerHTML = 'Enter number of dots to sample (' + newSampleSize + '-10,000):'

                    // New dots
                    const minTimeEqual = (element) => element.Time.getTime() == x.domain()[0].getTime();
                    const maxTimeEqual = (element) => element.Time.getTime() == x.domain()[1].getTime();
                    minTimeInd = data.findIndex(minTimeEqual)
                    maxTimeInd = data.findIndex(maxTimeEqual)
                    let timeIndDiff = maxTimeInd - minTimeInd

                    // Substract the nuber of already plotted dots from the number of dots to add
                    function isInbetween(ind, element) {
                        return ind[0] < element && element < ind[1] && eval("data[element]." + visparameter) != null;
                    }

                    // Sample new dots
                    let sampleSizeNew = newSampleSize - selectionCombined.filter(isInbetween.bind(this, [minTimeInd, maxTimeInd])).length
                    let selectionNew = Array.from({length: sampleSizeNew}, () => Math.floor(Math.random() * timeIndDiff + minTimeInd));
                    selectionCombined = [...selectionCombined, ...selectionNew];

                    // Define new filter Function
                    const selectionNewIncludes = function (d, i) {
                        if (selectionNew.includes(i) && eval("d." + visparameter) != null) {
                            return i
                        }
                    }
                    plotDots(selectionNewIncludes)
                }
            });
    })
}
