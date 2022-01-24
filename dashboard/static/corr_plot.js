/***
 * @author Marit Bockstedte
 ***/

// Constants:
const linregrColor = "#17A589";
const quadreColor = "#2E86C1";
const polreColor = "#9B59B6";
    
const margin = {top: 10, right: 30, bottom: 40, left: 60}, width = 1200 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

// Function to create the correlation plotz
function correlationPlot(divName, dotcolor){
    
    // Create the svg
    const svg = d3.select(divName)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    
    // Check if subscribe button was clicked
    let sub = document.getElementById("sub");
        
    sub.addEventListener("click", () => {

        // Check which variables were selected
        const v1 = document.getElementById("v1");
        const var1 = v1.value;
        const v2 = document.getElementById("v2");
        const var2 = v2.value;
        
        // Only display a plot if valid variables were chosen
        if (var1 == "None" || var2 == "None") {
            document.getElementById("corr").innerHTML = "Choose a valid variable";
          } else {
            // Delete old svg content
            svg.selectAll("*").remove();

            // Read data
            d3.csv(dataset).then(function (data) {

                // ---------------------- Preprocess -------------------------
                // Preprocess used from scatterplot by @author Lukas Gehring
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

                // ---------------------- Calculate day data -------------------------
                // HR and Temp: calculate average values per day
                // Steps and Calories: calculate sum per day
                let oldday = 0;
                let sumHR = 0; 
                let sumTemp = 0;
                let sumCal = 0; 
                let sumSteps = 0; 
                let num = 0; 
                let newdata = []

                data.forEach(function (d) {
                    if (oldday == 0){
                        oldday = d.Time.getDate();
                        sumHR = d.HR;
                        sumTemp = d.Temperature;
                        sumCal = d.Calories
                        sumSteps = d.Steps
                        num = 1;
                    } else if (d.Time.getDate() != oldday){
                        arr = {"Time": String(d.Time.getDate()) + "." + String(d.Time.getMonth()) + "." + String(d.Time.getFullYear()) + " " ,
                        "HR": sumHR/num, "Temperature": sumTemp/num, "Steps": sumSteps, "Calories": sumCal}
                        newdata.push(arr)
                        sumHR =  d.HR;
                        sumTemp = d.Temperature;
                        sumCal = d.Calories 
                        sumSteps = d.Steps 
                        num = 1;
                        oldday = d.Time.getDate();
                    } else {
                        sumHR = sumHR +  d.HR;
                        sumTemp = sumTemp + d.Temperature;
                        sumCal = d.Calories + sumCal
                        sumSteps = d.Steps + sumSteps
                        num = num + 1
                    }
                });     

                // Function to round the data to 2 digits
                function roundto2dig(number){
                    return Math.round(number* 100)/100;
                }
                
                // ---------------------- Calculate Correlation -------------------------
                // package source: https://thisancog.github.io/statistics.js/inc/correlation.html

                let variables = {
                    HR: 'metric',
                    Steps: 'metric',
                    Calories: 'metric',
                    Temperature: 'metric'
                }
                let stats = new Statistics(newdata, variables);

                // Calculate correlation
                let r = stats.correlationCoefficient(var1, var2);
                // Inform which correlation will be displayed
                document.getElementById("corr").innerHTML = "Correlation between "+ var1 +" and " + var2 + ": " 
                + "R = "+ roundto2dig(r.correlationCoefficient) ;

                // ---------------------- Create Plot -------------------------
                // find minimum and maximum values for var1 and var2
                const maxVar1= d3.max(newdata, function (d) {
                    return eval("d." + var1);
                });
                const minVar1= d3.min(newdata, function (d) {
                    return eval("d." + var1);
                });
                const maxVar2= d3.max(newdata, function (d) {
                    return eval("d." + var2);
                });
                const minVar2= d3.min(newdata, function (d) {
                    return eval("d." + var2);
                });

                // Function to find out the unit of the variables 
                function toUnit(variable){
                    unit = ""
                    if (variable == "HR"){
                        unit = " Average per day [BPM]"
                    } else if (variable == "Calories"){
                        unit = " Sum per day [1]"
                    } else if (variable == "Steps"){
                        unit = " Sum per day [1]"
                    } else if (variable == "Temperature"){
                        unit = " Average per day [F]"
                    }
                    return unit
                }

                // Add X-axis for var1
                let scaleX = d3.scaleLinear()
                    .domain([minVar1, maxVar1])
                    .range([0, width]);
                let xAxis = svg.append("g")
                    .attr("transform", `translate(0, ${height})`)
                    .call(d3.axisBottom(scaleX));
                
                // Add X-axis label
                svg.append("text")
                    .attr("text-anchor", "end")
                    .attr("x", width/2 + margin.left)
                    .attr("y", height + margin.top + 20)
                    .style("font-family", "Arial")
                    .text(var1 + toUnit(var1));

                // Add Y-axis for var2
                let scaleY = d3.scaleLinear()
                    .domain([minVar2, maxVar2])
                    .range([height, 0]);
                let yAxis = svg.append("g")
                    .call(d3.axisLeft(scaleY));
                
                 // Add Y-axis label
                svg.append("text")
                    .attr("text-anchor", "end")
                    .style("font-family", "Arial")
                    .attr("transform", "rotate(-90)")
                    .attr("y", -margin.left + 20)
                    .attr("x", -margin.top - height/2 + 20)
                    .text(var2 + toUnit(var2))

                // Add dots in scatter plot
                svg.selectAll("dot")
                    .data(newdata)
                    .enter()
                    .append("circle")
                        .attr("cx", function (d) { return scaleX(eval("d." + var1)); } )
                        .attr("cy", function (d) { return scaleY(eval("d." + var2)); } )
                        .attr("r", 7)
                        .style("fill", dotcolor)
                        .style("opacity", 0.5)
                        .style("stroke", "white")
                    .append("title")
                        .text(d => d.Time + var1 + ": " + Math.round(eval("d." + var1)) + ' | ' + var2 + ": " +  + Math.round(eval("d." + var2)))

                // ---------------------- Calculate Regressions -------------------------
                // source: https://github.com/harrystevens/d3-regression

                // check if Regression checkboxes were clicked
                let linRegrCheck = document.getElementById("linCheck");
                let quadRegrCheck = document.getElementById("quadCheck");
                let polRegrCheck = document.getElementById("polCheck");

                // Linear regression 
                const reglin = d3.regressionLinear()
                    .x(d => eval("d." + var1))
                    .y(d => eval("d." + var2));
                regression = reglin(newdata);

                // Quadratic Regression
                const regquad = d3.regressionQuad()
                    .x(d => eval("d." + var1))
                    .y(d => eval("d." + var2));
                quadregression = regquad(newdata);

                // Polynomail Regression (order = 3)
                const regpol = d3.regressionPoly()
                    .x(d => eval("d." + var1))
                    .y(d => eval("d." + var2))
                    .order(3);
                let polregression = regpol(newdata);
                console.log(polregression)
                
                // Function formatting regression data to plot them
                function regrNewformat(regrdata){
                    let regdata = regrdata.map(function(d) {
                        return {
                          x: d[0],
                          y: d[1]
                        };
                    });
                    return regdata;
                }

                // Function appending regression lines to svg
                function plotRegr(regrdata, regcolor, id){
                    svg.append('path')
                        .data([regrNewformat(regrdata)])
                        .attr("class", "line")
                        .style("fill","none")
                        .style("stroke-width", 3)
                        .attr("id", id)
                        .style("stroke", regcolor)
                        .attr("d", d3.line()
                            .x(function(d) { return scaleX(d.x) })
                            .y(function(d) { return scaleY(d.y) })
                        )
                }

                // Append linear regression if checkbox checked
                linRegrCheck.addEventListener("change", () => {
                    let linregr = document.getElementById("linregr");
                    if (linRegrCheck.checked) {
                        // inform about values
                        linregr.innerHTML = "Linear regression: y = " +  roundto2dig(regression.a) + " * x + " + 
                        roundto2dig(regression.b) + " | R<sup>2</sup> = "+   roundto2dig(regression.rSquared);
                        linregr.style.color = linregrColor;
                        // add to plot
                        plotRegr(regression, linregrColor, "lin")
                    } else {
                        linregr.innerHTML = "";
                        d3.select("#lin").remove();
                    }
                })

                // Append quadratic regression if checkbox checked
                quadRegrCheck.addEventListener("change", () => {
                    let quadregr = document.getElementById("quadregr");
                    if (quadRegrCheck.checked) {
                        // inform about values
                        quadregr.innerHTML = "Quadratic regression: y = " + roundto2dig(quadregression.a) + " * x<sup>2</sup> + " + 
                        roundto2dig(quadregression.b) +"* x + "+  roundto2dig(quadregression.c) + " | R<sup>2</sup> = " +  roundto2dig(quadregression.rSquared);
                        quadregr.style.color = quadreColor;
                        // add to plot
                        plotRegr(quadregression, quadreColor, "quad")
                    } else {
                        quadregr.innerHTML = "";
                        d3.select("#quad").remove();
                    }
                })

                // Append polynomial regression if checkbox checked
                polRegrCheck.addEventListener("change", () => {
                    let polregr = document.getElementById("polregr");
                    if (polRegrCheck.checked) {
                        // add to plot
                        plotRegr(polregression, polreColor, "pol")
                        // inform about values
                        polregr.innerHTML = "Polynomail regression (order = 3): y = " + roundto2dig(polregression.coefficients[3]) + " * x<sup>3</sup> + " + 
                        roundto2dig(polregression.coefficients[2])  + " * x<sup>2</sup> + " + 
                        roundto2dig(polregression.coefficients[1]) +"* x + "+  roundto2dig(polregression.coefficients[0]) + " | R<sup>2</sup> = " +  
                        roundto2dig(polregression.rSquared);
                        polregr.style.color = polreColor;
                    } else {
                        polregr.innerHTML = "";
                        d3.select("#pol").remove();
                    }
                })

            })
          }
    });
}
