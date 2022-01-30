/***
 * @author Lukas Gehring
 * based on: https://www.d3-graph-gallery.com/graph/boxplot_basic.html
 ***/

// Constructs a boxplot for the given parameter in the given div in the given color.
// Enter name of visparameter as given in the CSV Header and boxcolor as a string.
// Optionally takes a start and end date for the data used as datetime objects.
function boxplot(visparameter, divName, boxcolor, start = null, end = null) {
    const margin = {top: 10, right: 30, bottom: 30, left: 100}, width = 200 - margin.left - margin.right,
        height = 600 - margin.top - margin.bottom;


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

    // Round start/end date if available
    if (start != null && end != null) {
        // Round to nearest minute
        start = getRoundedDate(1, start)
        end = getRoundedDate(1, end)
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

        let visparamData = []
        // Read data and convert to correct type
        data.forEach(function (d) {
            d.Time = d3.isoParse(d.Time);
            d.Calories = toNumber(d.Calories);
            d.HR = toNumber(d.HR);
            d.Temperature = toNumber(d.Temperature);
            d.Steps = toNumber(d.Steps);

            if (start != null && end != null) {
                // If start/end given, choose only values inside timeframe
                if (start.valueOf() <= d.Time.valueOf() && d.Time.valueOf() <= end.valueOf()) {
                    visparamData.push(eval("d." + visparameter))
                }
            } else {
                // No start/end defined, include all values
                visparamData.push(eval("d." + visparameter))
            }
        });
        // --------------------------------------------------------------------------

        // Calculate boxplot parameters
        let visparamData_sorted = visparamData.sort(d3.ascending)
        let q1 = d3.quantile(visparamData_sorted, .25)
        let median = d3.quantile(visparamData_sorted, .5)
        let q3 = d3.quantile(visparamData_sorted, .75)
        let interQuantileRange = q3 - q1
        let min = q1 - 1.5 * interQuantileRange
        let max = q1 + 1.5 * interQuantileRange
        

        // adds y-axis label - changed by Marit
        // units
        const unitHR = " [BPM]";
        const unitTemp = " [F]";
        const unitCal = " [1]";
        const unitSteps = " [1]";

        // get unit -- implemented by Marit
        function unit(param){
            unit = "";
            if(param == "HR"){
            unit = unitHR;
            } else if (param == "Temperature"){
            unit = unitTemp;
            } else if (param == "Calories"){
                unit = unitCal;
            } else if (param == "Steps"){
                unit = unitSteps;
            }
            return unit;
        }

        // Show the Y scale
        let y = d3.scaleLinear()
            .domain([min - interQuantileRange/4, max + interQuantileRange/4])
            .range([height, 0]);
        svg.append("g")
            .call(d3.axisLeft(y))
        .append("text")
            .attr("text-anchor", "end")
            .style("font-size", "14px")
            .style("font-family", "Arial")
            .style('fill', 'black')
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left/2)
            .attr("x", -margin.top )
            .text(visparameter + unit(visparameter));
            
        // Box location/size
        // a few features for the box
        let center = 75
        let width = 75

        // Show main vertical line
        svg
            .append("line")
            .attr("x1", center)
            .attr("x2", center)
            .attr("y1", y(min))
            .attr("y2", y(max))
            .attr("stroke", "black")
            .style('stroke-width', 2)

        // Show box
        svg
            .append("rect")
            .attr("x", center - width / 2)
            .attr("y", y(q3))
            .attr("height", (y(q1) - y(q3)))
            .attr("width", width)
            .attr("stroke", "black")
            .style('stroke-width', 2)
            .style("fill", boxcolor)

        // Show median, min and max horizontal lines
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