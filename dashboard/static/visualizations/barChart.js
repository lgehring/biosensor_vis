/***
 * @author Lea Heinen
 ***/

 function barChart(param, div, color){
	console.log("colors colors on the wall");
	// elements from html file (buttons and checkbox)
	const buttonMonth_div = document.getElementById("ButtonMonth");
	const buttonWeek_div = document.getElementById("ButtonWeek");
	const buttonDay_div = document.getElementById("ButtonDay");
	const buttonHour_div = document.getElementById("ButtonHour");
	const statCheck_div = document.getElementById("stat");

	// Helping functions:
	const parseDateMinutes = d3.timeFormat("%d.%m.%Y %H:%M");
	const parseDateHours = d3.timeFormat("%d.%m.%Y, %H:00");
	const parseDateDays = d3.timeFormat("%d.%m.%Y");
	const parseDateWeeks = d3.timeFormat("CW %V/%Y");
	const parseDateMonths = d3.timeFormat("%b %Y");
	const parseDateTitle = d3.timeFormat("%a %d.%m.%Y, %H:%M")

	var enableDoubleClick = true;
	var arrayOfWeekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

	// function which produces an array of the tick values in regular intervals
	// necessary because a bar chart makes a tick at all bars if no tick array is specified
	function getTickArray(dataArray){
		  nTicks = 6
			if (dataArray.length <= nTicks) {
				return dataArray.map(d => d.date)
			}
	    const indicesBetweenPoints = Math.round(dataArray.length/nTicks)
	    tickArray = []
	    for (i = 0; i <= dataArray.length; i++){
	      if (i%indicesBetweenPoints == 0){
	        if (dataArray[i] != undefined){
	          tickArray.push(dataArray[i])
	        }
	    }
	  }
	  return tickArray.map(d => d.date)
	}


	// cuts an array at given start and end value (not indices!!!)
	function cutArray(array, start, end){
		startIndex = 0;
		endIndex = array.length - 1;
		i = 0
		iterator = array.values()
		for (const value of iterator){
			if (value["date"] == start){
				startIndex = i
			} if (value["date"] == end){
				endIndex = i
			}
			i += 1
		}
		return array.slice(startIndex, endIndex+1)
	}

	function getWeekDays(week, year){
		var anyDate = new Date(year, 0, 1 + (week - 1) * 7);  //any date within that week
	  var anyDay = anyDate.getDay();
	  var borderDay = anyDate;
		if (anyDay <= 4)
	      borderDay.setDate(anyDate.getDate() - anyDate.getDay() + 1);
	  else
	      borderDay.setDate(anyDate.getDate() + 8 - anyDate.getDay());
		monday = new Date(borderDay)
		borderDay.setDate(monday.getDate() + 6)
		sunday = new Date(borderDay)
	  return [monday, sunday];

	}

	function getPrecision(date){
		var datePrecision;
		if (/[A-Za-z]{3}/.test(date)){
			datePrecision = "Month"
		} else if (date.includes("CW")){
			datePrecision = "Week"
		} else if (/[0-9]{2}\.[0-9]{2}\.[0-9]{4}, [0-9]{2}:[0]{2}/.test(date)){
			datePrecision = "Hour"
		} else if (/[0-9]{2}\.[0-9]{2}\.[0-9]{4} [0-9]{2}:[0-9]{2}/.test(date)){
			datePrecision = "Minute"
		} else {
			datePrecision = "Day"
		}
		return datePrecision
	}

	function getDaysInMonth(date){
		month = ("0" + (date.getMonth() + 1)).slice(-2)
		year = date.getFullYear()
		daysInMonth = new Date(year, month, 0).getDate()
		return daysInMonth
	}

	function parseEuropeanDate(input) {
	  var parts = input.match(/(\d+)/g);
		if (parts.length > 3){
			return new Date(parts[2], parts[1]-1, parts[0],
				parts[parts.length-2], parts[parts.length-1]);
		} else {
			return new Date(parts[2], parts[1]-1, parts[0]);
		}
	}

	function getWeekDay(date){
		dateDateTime = parseEuropeanDate(date)
		return arrayOfWeekdays[dateDateTime.getDay()]
	}


	function getTimeRange(startDate, endDate){
			// gets a time range from the first possible moment of the start date
			// and the last possible moment of the end date
			// e.g. Mar 2015, Apr 2016
			//			--> 1st Mar 2015 00:00:00 and 30st Apr 2015 00:00:00
			datePrecision = getPrecision(startDate)
			console.log(datePrecision);
			switch (datePrecision) {
				case "Month":
				  // first day of first given month
					start = new Date(startDate)
					// last day of second given month
					end = new Date(endDate)
					daysInMonth = getDaysInMonth(end)
					end.setDate(end.getDate() + daysInMonth -1)
					end.setHours(23); end.setMinutes(59);
					break;
				case "Week":
				  // get first day of first given week
					week1 = startDate.split(" ")[1].split("/")[0]
					year1 = startDate.split("/")[1]
					weekDays1 = getWeekDays(week1, year1)
					start = weekDays1[0]
					// get last day of second given week
					week2 = endDate.split(" ")[1].split("/")[0]
					year2 = endDate.split("/")[1]
					weekDays2 = getWeekDays(week2, year2)
					end = weekDays2[1]
					end.setHours(23); end.setMinutes(59);
					console.log("start: " + start);
					console.log("end: " + end);
					break;
				case "Day":
				  // first hour + minute of first given day
					start = parseEuropeanDate(startDate)
					// last hour + minute of second given day
					end = parseEuropeanDate(endDate);
					end.setHours(23); end.setMinutes(59);
					break;
				case "Hour":
				 // get first minute of first given hour
					start = parseEuropeanDate(startDate)
					// get last minute of second given hour
					end = parseEuropeanDate(endDate);
					end.setMinutes(59);
					break;
				case "Minute":
				  // nothing should happen here (same as minute)
					start = parseEuropeanDate(startDate)
					end  = parseEuropeanDate(endDate)
					start.setMinutes(0); end.setMinutes(59);
					break;

			}
					return [start, end]
			}


		function handleClick(date){
			// handles the click on a bar
			enableDoubleClick = true
		  datePrecision = getPrecision(date)
			startDate = getTimeRange(date, date)[0]
			endDate = getTimeRange(date, date)[1]
			switch (datePrecision) {
				case "Month":
					// parses the dates correclty and selects the correct dataArray for rendering
					startDate = parseDateDays(startDate); endDate = parseDateDays(endDate)
					dataArray = nestedDataDays;
					break;
				case "Week":
					startDate = parseDateDays(startDate); endDate = parseDateDays(endDate)
					dataArray = nestedDataDays;
					break;
				case "Day":
					startDate = parseDateHours(startDate); endDate = parseDateHours(endDate)
					dataArray = nestedDataHours
					break;
				case "Hour":
				  startDate = parseDateMinutes(startDate); endDate = parseDateMinutes(endDate)
					dataArray = nestedDataMinutes
					break;
				case "Minute":  // graph should not zoom in any
				  alert("Zooming in further not possible.")
					enableDoubleClick = false
					return;

			}
			render(dataArray, startDate, endDate)
		}

		function getTitle(startDate, endDate){
			start = getTimeRange(startDate, endDate)[0]
			end = getTimeRange(startDate, endDate)[1]
			startTitle = parseDateTitle(start)
			endTitle = parseDateTitle(end)
			return [startTitle, endTitle]
		}

	/*
	 set svg dimensions and margins
	*/
	const margin = {top: 20, right: 30, bottom: 40, left: 100};
	const svgWidth = 800  - margin.left - margin.right;
	const svgHeight = 360 - margin.top - margin.bottom;

	// append the svg object to the body of the page
	let svg = d3.select(div)
	  .append("svg")
	  .attr("width", svgWidth + margin.left + margin.right)
	  .attr("height", svgHeight + margin.top + margin.bottom)
	  .attr("class", "chart")
	  .append("g")
	      .attr("transform", `translate(${margin.left}, ${margin.top})`);


	// the function render makes the plot and is called every time there by button click or brushing
	const render = (data, startDate, endDate) => {
		// before every rendering everything is cleared from the svg
		svg.selectAll('*').remove();

		// if the render function is called through the updateChart function it does not
		// need to be converted, but cut
		if(data.constructor === Array){
			dataArray = data
		} else {
			// otherwise the map needs to be converted into an array
			dataArray = Array.from(data, ([date, value]) => ({ date, value }));
			originalData = dataArray.slice() //copies the array, so when user double clicks, this can be drawn
		}
		dataArray = cutArray(dataArray, startDate, endDate)
		titleArray = getTitle(startDate, endDate)
		titleParts = cutArray(possibleTitles, titleArray[0], titleArray[1])
		startDateFull = titleParts[0].date
		endDateFull = titleParts[titleParts.length -1].date

		document.getElementById("title").innerHTML =
		"<h2>" + startDateFull + " - " + endDateFull + "</h2>";


		/*
		X Scale
		*/

	  xScale = d3.scaleBand()
	    .domain(dataArray.map(d => d.date))
	    .range([0, svgWidth])
			.padding(0.1)

	  const ticks = getTickArray(dataArray)

		/*
		X axis formatting
		*/

	  const xAxis = d3.axisBottom(xScale)
	      .tickValues(ticks)
				.tickSizeOuter(0)
	  const xAxisGroup = svg.append('g')
	    .attr("transform", `translate(0, ${svgHeight})`)
	    .call(xAxis)

		// adds x-axis label - changed by Marit
		svg.append("text")
			.attr("text-anchor", "end")
			.attr('class', 'axisLabel')
			.attr("x", svgWidth/2 + margin.left)
			.attr("y", svgHeight + margin.top+ 20)
			.style("font-size", "14px")
			.style("font-family", "Arial")
			.text("Time Interval");

		/*
		Y Scale
		*/

	  yScale = d3.scaleLinear()
	    .domain([0, d3.max(dataArray, d => d.value)])
	    .range([svgHeight, 0])

		/*
		Y axis formatting
		*/

	  const yAxis = d3.axisLeft(yScale)
	    .tickSizeOuter(0)
	  const yAxisGroup = svg.append('g')
	    .call(yAxis)

	// adds y-axis label - changed by Marit
	svg.append("text")
		.attr("text-anchor", "end")
		.attr('class', 'axisLabel')
		.style("font-size", "14px")
		.style("font-family", "Arial")
		.attr("transform", "rotate(-90)")
		.attr("y", -margin.left/1.7)
		.attr("x", -margin.top)
		.text(param+ " [1]");

	  svg.selectAll(".tick")
	    .filter(function (d) { return d === 0;  })
	    .remove();

	    // Add brushing
	    brush = d3.brushX()
	      .extent([[0,0], [svgWidth,svgHeight]])
	      .on("end", updateChart)

		  const brusher = svg.append("g")

			/*
			Rendering the bars
			*/

				svg.selectAll("rect")
				.data(dataArray)
				.enter()
				.append("rect")
				.attr("class", "bars")
				.attr("x", d => xScale(d.date))
				.attr("y", d => yScale(d.value))
				.attr("height", d => svgHeight - yScale(d.value))
				.attr("width", xScale.bandwidth())
				.style("fill", color)
				.on("click", (i, d) => handleClick(d.date))
				.append("title")
					.text(d => "Date " + d.date + "\n" + param + ": " + d.value)



				// if annation is true, but the change is not current, for instance when
				// graph was updated, the annotations need to be recalculated and redrawn
				if (annotation){
						annotateStats()
					}

			brusher.call(brush)
			svg.on("dblclick",function(){
				if (enableDoubleClick){
					 render(originalData, originalData[0], originalData.at(-1))
				}});

	};

	// function to update the chart, called after brushing
	const updateChart = event => {
	  extent = event.selection
		if (extent == null){
			return
		}
		// gets the selected region
	  selected =  xScale.domain().filter(d =>
	             	(extent[0] - xScale.bandwidth() <= xScale(d)) //bandwidth to include left bar, if touched by brush
								&& (xScale(d) <= extent[1]));
		render(dataArray, selected[0], selected.at(-1))
	}

	// function to annotate statistics
	const annotateStats = () => {
	  values = dataArray.map(d => d.value)
		// minima should not include 0
		valuesWithoutZero = values.filter(number => number != 0)
		min = d3.min(valuesWithoutZero)
		max= d3.max(values)
		avg = d3.mean(values)
		// put values in a map to map title to stat
		stats = new Map()
		stats.set("Minimum (not 0)", min); stats.set("Maximum", max); stats.set("Average", avg)
		statsArray = Array.from(stats, ([title, stat]) => ({title, stat}));

	 // color scale to color stats differently
		const colors = ["rgb(61, 222, 77)", "rgb(240, 62, 28)", "rgb(254, 231, 24)"]
		var color = d3.scaleOrdinal()
			.domain(statsArray.map(d => d.title))
			.range(colors)


		// render the annotations
	 	svg.selectAll("lines")
			.data(statsArray)
			.enter()
	  	.append("line")
			.attr("x1", 0)
			.attr("x2", svgWidth)
			.attr("y1", d => yScale(d.stat))
			.attr("y2", d => yScale(d.stat))
			.style("stroke", d => color(d))
			.style("stroke-width", 5)
			.style("stroke-dasharray", ("6, 2"))
			.append("title")
			.text(d => d.title + ": " + d.stat)
	}

	d3.csv(dataset).then(data =>{
	    data.forEach(d => {
				// format the Data correctly
	      d.Steps = +d.Steps
				d.Calories = +d.Calories
				d.Heartrate = +d.HeartRate
				d.Temperature = +d.Temperature
	      d.Time = d3.isoParse(d.Time)
				d.Minutes = parseDateMinutes(d.Time)
	      d.Hours = parseDateHours(d.Time)
	      d.Days = parseDateDays(d.Time)
	      d.Weeks = parseDateWeeks(d.Time)
	      d.Months = parseDateMonths(d.Time)
				d.Title = parseDateTitle(d.Time)

	    });

			// nest the Data correctly into maps
			nestedDataMinutes = d3.rollup(data, v => d3.sum(v,d  => eval("d." + param)), d => d.Minutes)
	    nestedDataHours = d3.rollup(data, v => d3.sum(v,d => eval("d." + param)), d => d.Hours)
	    nestedDataDays = d3.rollup(data, v => d3.sum(v,d => eval("d." + param)), d => d.Days)
	    nestedDataWeeks = d3.rollup(data, v => d3.sum(v,d => eval("d." + param)), d => d.Weeks)
	    nestedDataMonths = d3.rollup(data, v => d3.sum(v,d => eval("d." + param)), d => d.Months)
			nestedDateTitle =  d3.rollup(data, v => d3.sum(v,d => eval("d." + param)), d => d.Title)

			possibleTitles = Array.from(nestedDateTitle, ([date]) => ({ date}));


			// Event Listening for the check box
			annotation = false
			statCheck_div.addEventListener("change", d => {
			if (d.target.checked){
				annotation = true
				annotateStats()
			} else {
				annotation = false
				svg.selectAll("line").remove()
			}
	 	 })

		  // default case: Months are rendered
			render(nestedDataMonths, nestedDataMonths[0], nestedDataMonths[-1])


			// event listeners for the buttons
	    buttonHour_div.addEventListener("click", function(){
	        render(nestedDataHours, nestedDataHours[0], nestedDataHours[-1])
	    })

	    buttonDay_div.addEventListener("click", function(){
	        render(nestedDataDays, nestedDataDays[0], nestedDataDays[-1])

	    })

	    buttonWeek_div.addEventListener("click", function(){
	        render(nestedDataWeeks, nestedDataWeeks[0], nestedDataWeeks[-1])
	    })

	    buttonMonth_div.addEventListener("click", function(){
	        render(nestedDataMonths, nestedDataMonths[0], nestedDataMonths[-1])
	    })


	  })
	}
