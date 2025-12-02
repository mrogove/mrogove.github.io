var width = 960,
    height = 136,
    cellSize = 17; // cell size

var dayFormat = d3.timeFormat("%w"),
    weekFormat = d3.timeFormat("%U"),
    percent = d3.format(".1%"),
    format = d3.timeFormat("%Y-%m-%d");

// Helper functions to get numeric day and week values
var day = function(d) { return +dayFormat(d); };
var week = function(d) { return +weekFormat(d); };

var color = d3.scaleQuantize()
    .range(d3.range(9).map(function(d) { return "q" + d + "-9"; }));

d3.csv("Fremont_Bridge_Bicycle_Counter_20251202.csv").then(function(data) {
  if (!data) {
    console.error("No data loaded");
    return;
  }

  var finalData = {};
  var dailyTotals = {};
  var minYear = 9999;
  var maxYear = 0;

  // Iterate over all rows of data
  for (var i = 0; i < data.length; i++) {
    var datum = data[i];
    
    // Skip rows with missing data
    var totalStr = datum["Fremont Bridge Sidewalks, south of N 34th St Total"];
    if (!totalStr || totalStr.trim() === "") {
      continue;
    }
    
    // Parse the date and time
    var dateTimeStr = datum["Date"];
    if (!dateTimeStr || dateTimeStr.trim() === "") {
      continue;
    }
    
    var parts = dateTimeStr.split(" ");
    var dateStr = parts[0]; // Get MM/DD/YYYY format
    
    // Convert MM/DD/YYYY to YYYY-MM-DD
    var dateParts = dateStr.split("/");
    if (dateParts.length === 3) {
      var monthNum = dateParts[0];
      var dayNum = dateParts[1];
      var yearNum = dateParts[2];
      var parsedDate = yearNum + "-" + ("0" + monthNum).slice(-2) + "-" + ("0" + dayNum).slice(-2);
      
      var year = parseInt(yearNum);
      if (year < minYear) minYear = year;
      if (year > maxYear) maxYear = year;
    } else {
      continue;
    }

    // Get the total count for this hour
    var total = parseInt(totalStr) || 0;
    
    // Aggregate by day (sum all hourly totals)
    if (!dailyTotals[parsedDate]) {
      dailyTotals[parsedDate] = 0;
    }
    dailyTotals[parsedDate] += total;
  }

  // Convert to format expected by visualization
  for (var date in dailyTotals) {
    finalData[date] = dailyTotals[date];
  }

  console.log("Date range: " + minYear + " to " + maxYear);
  console.log("Total days with data: " + Object.keys(finalData).length);
  console.log(finalData);

  var values = [];
  for (var parsedDate in finalData) {
    values.push(finalData[parsedDate]);
  }
  console.log(values);

  color.domain(d3.extent(values));

  // Update the calendar view with the actual year range
  var thisyear = maxYear + 1;
  
  // Re-create the SVG elements with the correct year range
  var svg = d3.select("div#time-series").selectAll("svg")
      .data(d3.range(minYear, thisyear))
    .enter().append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("class", "RdYlGn")
    .append("g")
      .attr("transform", "translate(" + ((width - cellSize * 53) / 2) + "," + (height - cellSize * 7 - 1) + ")");

  svg.append("text")
      .attr("transform", "translate(-6," + cellSize * 3.5 + ")rotate(-90)")
      .style("text-anchor", "middle")
      .style("fill", "#fff")
      .style("font-size", "30px")
      .text(function(d) { return d; });

  var rect = svg.selectAll(".day")
      .data(function(d) { return d3.timeDays(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
    .enter().append("rect")
      .attr("class", "day")
      .attr("width", cellSize)
      .attr("height", cellSize)
      .attr("x", function(d) { return week(d) * cellSize; })
      .attr("y", function(d) { return day(d) * cellSize; })
      .datum(format);

  rect.append("title")
      .text(function(d) { return d; });

  svg.selectAll(".month")
      .data(function(d) { return d3.timeMonths(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
    .enter().append("path")
      .attr("class", "month")
      .attr("d", monthPath);

  rect.filter(function(d) { return d in finalData; })
      .attr("class", function(d) { 
        return "day " + color(finalData[d]);
      })
      .style("opacity", 0)
      .transition().duration(500)
      .style("opacity", 1)
    .select("title")
      .text(function(d) { return d + ": " + finalData[d]; });

  rect.filter(function(d) { return !(d in finalData); })
      .attr("class", "day-empty")
    .select("title")
      .text(function(d) { return d + ": No Data"; });  

}).catch(function(error) {
  console.error("Error loading CSV:", error);
});

function monthPath(t0) {
  var t1 = new Date(t0.getFullYear(), t0.getMonth() + 1, 0),
      d0 = +day(t0), w0 = +week(t0),
      d1 = +day(t1), w1 = +week(t1);
  return "M" + (w0 + 1) * cellSize + "," + d0 * cellSize
      + "H" + w0 * cellSize + "V" + 7 * cellSize
      + "H" + w1 * cellSize + "V" + (d1 + 1) * cellSize
      + "H" + (w1 + 1) * cellSize + "V" + 0
      + "H" + (w0 + 1) * cellSize + "Z";
}

d3.select(self.frameElement).style("height", "2910px");
