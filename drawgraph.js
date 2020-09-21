var width = 960,
    height = 136,
    cellSize = 17; // cell size

var day = d3.time.format("%w"),
    week = d3.time.format("%U"),
    percent = d3.format(".1%"),
    format = d3.time.format("%Y-%m-%d");

var color = d3.scale.quantize()
    .range(d3.range(9).map(function(d) { return "q" + d + "-9"; }));

var thisyear = new Date();
thisyear = thisyear.getFullYear()+1;

var svg = d3.select("div#time-series").selectAll("svg")
    .data(d3.range(2012, thisyear))
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
    .data(function(d) { return d3.time.days(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
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
    .data(function(d) { return d3.time.months(new Date(d, 0, 1), new Date(d + 1, 0, 1)); })
  .enter().append("path")
    .attr("class", "month")
    .attr("d", monthPath);

d3.json("https://data.seattle.gov/api/views/eytj-7qg9/rows.json", function(e, j) {
  var initialData = j.data;
  var finalData = {};

  var finalList = [];

  // Iterate over all rows of data
  for (var i=0; i < initialData.length; i++) {
    // Isolate the day
    var datum = initialData[i];

    // Sum the counts
    var sum = parseInt(datum[9]) + parseInt(datum[10]);
    
    // Parse the date
    var date = datum[8];
    var parsedDate = date.split('T')[0];

    // Map from key (date) to value (sum)
    finalData[parsedDate] = sum;
  }

  console.log(finalData);

var values = [];
  for (var parsedDate in finalData) {
    values.push(finalData[parsedDate]);
  }
  console.log(values);

  //var minDomain = d3.max(data);
  //console.log(minDomain);
  // var maxDomain = d3.max(data, function(d) {return +d});
  // color.domain([200,4000]);
  color.domain(d3.extent(values));



  rect.filter(function(d) { return d in finalData; })
      .attr("class", function(d) { 
        return "day " + color(finalData[d]);
      })
      .style("opacity", 0)
      .transition().duration(500)
      .style("opacity", 1)
    .select("title")
      .text(function(d) { return d + ": " + finalData[d]; });  // How to add getDay() for day of week on mouseover?

  rect.filter(function(d) { return !(d in finalData); })
      .attr("class", "day-empty")
    .select("title")
      .text(function(d) { return d + ": No Data"; });  

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
