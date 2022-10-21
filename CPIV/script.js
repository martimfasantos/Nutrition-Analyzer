var margin = {top: 30, right: 10, bottom: 10, left: 0},
  width = 500 - margin.left - margin.right,
  height = 400 - margin.top - margin.bottom;

var svg = d3.select("#vi1")
.append("svg")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
.append("g")
  .attr("transform",
        "translate(" + margin.left + "," + margin.top + ")");

d3.csv("nutrition.csv").then(function (data) {
    dimensions = Object.keys(data[0]).filter(function(d) { return d != "name" && d != "type" && d != "description" && d != "category" && d != "serving_size" 
    && d != "calories_daily_intake_percentage" && d != "fat_percentage" && d != "sodium_daily_intake_percentage" && d != "calcium" && d != "magnesium" && d != "protein_percentage" 
    && d != "protein_daily_intake_percentage" && d !="carbohydrate_daily_intake_percentage" && d != "sugars" && d != "fructose" && d != "glucose" && d !="lactose" 
    && d !="total_fat" && d !="alcohol" && d !="water_percentage_serving_size"}) // basicamente todos os que nao sao attributos dos alimentos sao filtrados aqui

    var y = {}
    for (i in dimensions) {
      name = dimensions[i]
      y[name] = d3.scaleLinear()
        .domain( d3.extent(data, function(d) { return +d[name]; }) )
        .range([height, 0])
    }

    x = d3.scalePoint()
    .range([0, width])
    .padding(1)
    .domain(dimensions);
    
    function path(d) {
        return d3.line()(dimensions.map(function(p) { return [x(p), y[p](d[p])]; }));
    }

    svg
    .selectAll("myPath")
    .data(data)
    .enter().append("path")
    .attr("d",  path)
    .style("fill", "none")
    .style("stroke", "#69b3a2")
    .style("opacity", 0.5)

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
    .text(function(d) { return d; })
    .style("fill", "black")



})