const getWeekDay = d3.timeFormat("%a")
const getHour = d3.timeFormat("%H:00");


d3.csv(dataset).then(data =>{
    data.forEach(d => {
			// format the Data correctly
      d.Steps = +d.Steps
			d.Calories = +d.Calories
			d.Heartrate = +d.HeartRate
			d.Temperature = +d.Temperature
      d.Time = d3.isoParse(d.Time)
			d.Weekday = getWeekDay(d.Time)
			d.Hour = getHour(d.Time)
    });
		weekDayGroup = d3.group(data, d => d.Weekday);
		weekDayHour = d3.group(weekDayGroup, d => d.Hour)
		console.log(weekDayGroup);
	});
