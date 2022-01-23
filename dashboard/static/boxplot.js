/***
 * @author Lukas Gehring
 * based on: https://www.d3-graph-gallery.com/graph/boxplot_basic.html
 ***/

// Constructs a boxplot in the given div.
// Enter name of visparameter as given in the CSV Header and dotcolor as a string.
function boxplot(visparameter, divName, dotcolor) {
    const margin = {top: 10, right: 30, bottom: 30, left: 60}, width = 200 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;

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

        let visCol = []
        // Read in as correct datatypes
        data.forEach(function (d) {
            d.Time = d3.isoParse(d.Time);
            d.Calories = toNumber(d.Calories);
            d.HR = toNumber(d.HR);
            d.Temperature = toNumber(d.Temperature);
            d.Steps = toNumber(d.Steps);

            // Build visparameter column array
            visCol.push(eval("d." + visparameter))
        });

        const maxVis = d3.max(data, function (d) {
            return eval("d." + visparameter);
        });
        const minVis = d3.min(data, function (d) {
            return eval("d." + visparameter);
        });

        // --------------------------------------------------------------------------
        // Compute summary statistics used for the box:
        var data_sorted = visCol.sort(d3.ascending)
        var q1 = d3.quantile(data_sorted, .25)
        var median = d3.quantile(data_sorted, .5)
        var q3 = d3.quantile(data_sorted, .75)
        var interQuantileRange = q3 - q1
        var min = q1 - 1.5 * interQuantileRange
        var max = q1 + 1.5 * interQuantileRange

        // Show the Y scale
        var y = d3.scaleLinear()
            .domain([0, maxVis])
            .range([height, 0]);
        svg.call(d3.axisLeft(y))

        // a few features for the box
        var center = 75
        var width = 75

        // Show the main vertical line
        svg
            .append("line")
            .attr("x1", center)
            .attr("x2", center)
            .attr("y1", y(min))
            .attr("y2", y(max))
            .attr("stroke", "black")
            .style('stroke-width', 2)

        // Show the box
        svg
            .append("rect")
            .attr("x", center - width / 2)
            .attr("y", y(q3))
            .attr("height", (y(q1) - y(q3)))
            .attr("width", width)
            .attr("stroke", "black")
            .style('stroke-width', 2)
            .style("fill", dotcolor)

        // show median, min and max horizontal lines
        svg
            .selectAll("toto")
            .data([min, median, max])
            .enter()
            .append("line")
            .attr("x1", center - width / 2)
            .attr("x2", center + width / 2)
            .attr("y1", function (d) {
                return (y(d))
            })
            .attr("y2", function (d) {
                return (y(d))
            })
            .attr("stroke", "black")
            .style('stroke-width', 2)
    })
}