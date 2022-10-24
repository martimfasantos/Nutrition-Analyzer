function init() {
  createTreeMap("#treemap");
}

function createTreeMap(id) {
  const margin = { top: 20, right: 30, bottom: 40, left: 90 },
        width = 1400 - margin.left - margin.right,
        height = 400 - margin.top - margin.bottom;

  const svg = d3
    .select(id)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("id", "gTreeMap")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  d3.csv("nutritionEDITED.csv").then(function (data) {
    var root = d3
      .stratify()
      .id(function (d) {
        return d.child;
      })
      .parentId(function (d) {
        return d.parent;
      })(data);

    root.sum(function (d) {
      return d.quantity;
    });

    d3.treemap()
    .size([width, height])
    //.padding(0.5)
    .paddingTop(15)
    .paddingRight(2)
    .paddingInner(3) 
    (root);

    // prepare a color scale
    var color = d3.scaleOrdinal()
    .domain(["Vegetables", "Meat", "Dairy", "Others", "Fish", "Fruits", "Starchy food", "Fast food", "Oils", "Beverages"])
    .range([ "#098526", "#fa050d", "#f72ae3","#030000", "#05005c", "#011f06","#402D54", "#D18975", "#838701","#001202"])

    // And a opacity scale
    var opacity = d3.scaleLinear()
      .domain([10, 30])
      .range([.6,1])

    svg
      .selectAll("rect.rectValue")//rect.rectValue
      .data(root.leaves())
      .enter()
      .append("rect")
      .attr("class", "rectValue itemValue")
      .attr('x', function (d) { return d.x0; })
      .attr('y', function (d) { return d.y0; })
      .attr('width', function (d) { return d.x1 - d.x0; })
      .attr('height', function (d) { return d.y1 - d.y0; })
      .style("stroke", "black")
      .style("fill", function(d){ return color(d.data.parent)} )
      .style("opacity", function(d){ return opacity(d.data.quantity)})
      .on("mouseover", (event, d) => handleMouseOver(d))
      .on("mouseleave", (event, d) => handleMouseLeave())
      
      //FIXME sacar o nome do parent do rectangulo para depois filtrar
      .on("click",function(d){
        //var title = d.data.parent Node.parentNode.getElementsByTagName("title")[0].childNodes[0];
        console.log(d);
      });

    // and to add the text labels
    svg
      .selectAll("text")
      .data(root.leaves())
      .enter()
      .append("text")
      .attr("x", function(d){ return d.x0+1})    // +10 to adjust position (more right)
      .attr("y", function(d){ return d.y0+15})    // +20 to adjust position (lower)
      .text(function(d){ return d.data.child })
      .attr("font-size", "13px")
      .attr("fill", "white")

    // and to add the text labels
    svg
        .selectAll("vals")
        .data(root.leaves())
        .enter()
        .append("text")

        .attr("x", function(d){ return d.x0+5})    // +10 to adjust position (more right)
        .attr("y", function(d){ return d.y0+26})    // +20 to adjust position (lower)
        .text(function(d){ return d.data.quantity })
        .attr("font-size", "11px")
        .attr("fill", "white")

    // Add title for the 3 groups
    svg
      .selectAll("titles")
      .data(root.descendants().filter(function(d){return d.depth==1}))
      .enter()
      .append("text")
      .attr("x", function(d){ return d.x0})
      .attr("y", function(d){ return d.y0+12})
      .text(function(d){ return d.data.child })
      .attr("font-size", "16px")
      //.attr("fill",  function(d){ return color(d.data.parent)} )

    // Add title "Food Categories"
    svg
      .append("text")
      .attr("x", +450)
      .attr("y", +10)
      .text("Food Categories")
      .attr("font-size", "19px")
      .attr("fill",  "black" )
  });
}


function handleMouseOver(item) {
  d3.selectAll(".itemValue")
  .filter(function (d, i) {
    return d.data.parent == item.data.parent;
  })
  .style("fill", "#03518c");
}

function handleMouseLeave() {

  // prepare a color scale
  var color = d3.scaleOrdinal()
  .domain(["Vegetables", "Meat", "Dairy", "Others", "Fish", "Fruits", "Starchy food","Fast food","Oils","Beverages"])
  .range([ "#098526", "#fa050d", "#f72ae3","#030000", "#05005c", "#011f06","#402D54", "#D18975", "#838701","#001202"])

  // And a opacity scale
  var opacity = d3.scaleLinear()
    .domain([10, 30])
    .range([.6,1])

  d3.selectAll(".itemValue")
  .style("fill", function(d){ return color(d.data.parent)} )
  .style("opacity", function(d){ return opacity(d.data.quantity)})
}
