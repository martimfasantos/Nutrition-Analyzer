var margin = {top: 30, right: 40, bottom: 40, left: 50},
    width = 1200 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

var svg = d3.select("#jitter_plot")
  .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform",
          "translate(" + margin.left + "," + margin.top + ")");

d3.csv('nutrition.csv').then(function(data) {
  // X scale
  var x = d3.scaleBand()
    .range([ 0, width ])
    .domain(["Fruits",
    "Vegetables",
    "Meat",
    "Fish",
    "Oils",
    "Starchy food",
    "Fast food",
    "Dairy",
    "Beverages",
    "Others"])
    .paddingInner(1)
    .paddingOuter(.5)
  svg.append("g")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x))

    svg.append("text")
    .attr("text-anchor", "end")
    .attr("x", width-550)
    .attr("y", -15)
    .text("Calories");  // nome do attributo a ser comparado em cima do grafico

  //Y scale
  var y = d3.scaleLinear()
    .domain([0,1000])
    .range([height, 0])
  svg.append("g")
  .call(d3.axisLeft(y)) 

  var myColor = d3.scaleSequential()
    .interpolator(d3.interpolateInferno)
    .domain([1000,0])          // cor chroma

// Os Pontos
var jitterWidth = 50
svg
  .selectAll("indPoints")
  .data(data)
  .enter()
  .append("circle")
    .attr("cx", function(d){return(x(d.category) - jitterWidth/2 + Math.random()*jitterWidth )}) // onde se calculam as categorias 
    .attr("cy", function(d){return(y(d.calories))}) // onde se coloca o attributo 
    .attr("r", 4)
    .style("fill", function(d){ return(myColor(d.calories))})
    .attr("stroke", "black")


})