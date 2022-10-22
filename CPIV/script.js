const margin = {top: 30, right: 0, bottom: 10, left: 10};
const width = 1100 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3
  .select("#parallelCoordinates")
  .append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("id", "gParallelCoord")
  .attr("transform",
        `translate(${margin.right},${margin.top})`);


// Parse the Data
d3.csv("nutrition.csv").then(function (data) {

  const color = d3.scaleOrdinal()
    .domain(["Meat", "Fish", "Dairy", "Fruits", "Vegetables", "Oils", "Beverages", "Starchy Food", "Fast Food", "Others"])
    .range(["#cc0000", "#0033cc", "#e8e8a6", "#339933", "#80ffaa", "#ffcccc", "#333399", "#996600", "#ff6699", "#1a1100"])

  dimensions = Object.keys(data[0]).filter(function(d) { return d != "name" && d != "type" && d != "description" && d != "category" && d != "serving_size (g)" 
  && d != "calories_daily_intake_percentage" && d != "fat_percentage" && d != "sodium_daily_intake_percentage" && d != "calcium (mg)" && d != "magnesium (mg)" && d != "protein_percentage" 
  && d != "protein_daily_intake_percentage" && d != "carbohydrate_daily_intake_percentage" && d != "alcohol" && d != "water_percentage_serving_size" && d != "caffeine (mg)"})

  const y = {}
  for (i in dimensions) {
    attr = dimensions[i]
    console.log(attr)
    y[attr] = d3.scaleLinear()
      .domain(d3.extent(data, function(d) { return +d[attr]; }))
      .range([height, 0])
  }

  // Build the x scale
  x = d3.scalePoint()
    .range([0, width])
    .padding(0.75)
    .domain(dimensions);

  // Highlight the specie that is hovered
  const highlight = function(event, d){

    selected_categ = d.category
    console.log(selected_categ)

    // first every group turns grey
    d3.selectAll(".line")
      .transition().duration(200)
      .style("stroke", "lightgrey")
      .style("opacity", "0.3")
    // Second the hovered item takes its color
    d3.selectAll("." + selected_categ)
      .transition().duration(200)
      // .style("stroke-width", 10000)
      .style("stroke", color(selected_categ))
      .style("opacity", "3")
  }

  // Unhighlight
  const doNotHighlight = function(event, d){
    d3.selectAll(".line")
      .transition().duration(200).delay(250)
      .style("stroke", "lightgrey")
      .style("opacity", "1")
  }

  // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this raw.
  function path(d) {
    return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
  }

  // Draw the lines
  svg
  .selectAll("myPath")
  .data(data)
  .join("path")
  .attr("class", function (d) { return "line " + d.category } )
  .attr("d",  path)
  .style("fill", "none")
  .style("stroke", "lightgrey")
  .style("opacity", 0.5)
  .on("mouseover", highlight)
  .on("mouseleave", doNotHighlight )
  

  // Draw the axis:
  svg.selectAll("myAxis")
    // For each dimension of the dataset I add a 'g' element:
    .data(dimensions).enter()
    .append("g")
    // I translate this element to its right position on the x axis
    .attr("transform", function(d) { return "translate(" + x(d) + ")"; })
    // And I build the axis with the call function
    .each(function(d) { d3.select(this).call(d3.axisLeft().scale(y[d])); })
    // Add axis title
    .append("text")
      .style("text-anchor", "middle")
      .attr("y", -9)
      .text(function(d) { return d.split(" ")[0].replace(/\_/g, " "); })
      .style("fill", "black")

})