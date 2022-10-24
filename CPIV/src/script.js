
const jitterWidth = 35
const LEFT = 0,
      RIGHT = 1;

const myColor = d3.scaleSequential()
                  .interpolator(d3.interpolateInferno);

const categories = ["Fruits",
                    "Vegetables",
                    "Meat",
                    "Fish",
                    "Oils",
                    "Starchy food",
                    "Fast food",
                    "Dairy",
                    "Beverages",
                    "Others"];

                    // TO ADJUST
const yscales = { "calories" : [0, 1000],
                  "fat" : [0, 120],
                  "protein" : [0, 70],
                  "carbohydrates" : [0, 100],
                  "sodium" : [0, 3000],
                  "potassium" : [0, 1800]
};

function init() {
    createTreeMap("#treemap");
    createJitterPlot("calories", "Meat", "Fish");
    createJitterPlot("fat", "Meat", "Fish");
    createJitterPlot("protein", "Meat", "Fish");
    createJitterPlot("carbohydrates", "Meat", "Fish");
    createJitterPlot("sodium", "Meat", "Fish");
    createJitterPlot("potassium", "Meat", "Fish");
    d3.select("#category-compare-calories").on("click", () => {
        updateJitterPlots("calories", RIGHT, "Meat", document.getElementById("category-compare-calories").value);
    });
    d3.select("#category-compare-fat").on("click", () => {
        updateJitterPlots("fat", RIGHT, "Meat", document.getElementById("category-compare-fat").value);
    });
    d3.select("#category-compare-protein").on("click", () => {
        updateJitterPlots("protein", RIGHT, "Meat", document.getElementById("category-compare-protein").value);
    });
    d3.select("#category-compare-carbohydrates").on("click", () => {
        updateJitterPlots("carbohydrates", RIGHT, "Meat", document.getElementById("category-compare-carbohydrates").value);
    });
    d3.select("#category-compare-sodium").on("click", () => {
        updateJitterPlots("sodium", RIGHT, "Meat", document.getElementById("category-compare-sodium").value);
    });
    d3.select("#category-compare-potassium").on("click", () => {
        updateJitterPlots("potassium", RIGHT, "Meat", document.getElementById("category-compare-potassium").value);
    });
}
  
function createTreeMap(id) {
    const margin = { top: 20, right: 0, bottom: 0, left: 25 },
            width = 1500 - margin.left - margin.right,
            height = 380 - margin.top - margin.bottom;

    const svg = d3
        .select(id)
        .append("svg")
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
        .attr("class", "rectValue TreeItemValue")
        .attr('x', function (d) { return d.x0; })
        .attr('y', function (d) { return d.y0; })
        .attr('width', function (d) { return d.x1 - d.x0; })
        .attr('height', function (d) { return d.y1 - d.y0; })
        .style("fill", function(d){ return color(d.data.parent)} )
        .style("opacity", function(d){ return opacity(d.data.quantity)})
        .on("mouseover", (event, d) => handleMouseOver(d))
        .on("mouseleave", (event, d) => handleMouseLeave())
        .on("click", (event, d) => onClickers(d))

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
        // .attr("fill",  function(d){ return color(d.data.parent)} )

        // Add title "Food Categories"
        svg
        .append("text")
        .attr("x", width/2)
        .attr("y", +5)
        .text("Food Categories")
        .attr("font-size", "20px")
        .attr("font-weight", "bold")
        .attr("fill",  "black" )
    });
}

function createJitterPlot(attribute, category1, category2){
    const margin = {top: 40, right: 40, bottom: 40, left: 90},
        width = 300 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;
      
    const svg = d3
      .select(`#jitterPlot-${attribute}`)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("id", `gJitterPlot-${attribute}`)
      .attr("transform", `translate(${margin.left},${margin.top})`);
  
    d3.csv('nutrition.csv').then(function(data) {
      data = data.filter(function (item) {
        return item.category === category1 || item.category === category2;
      });
      
      const key = getKey(data, attribute);
  
      // X scale
      const x = d3.scaleBand()
        .range([0, width])
        .domain([category1, category2])
        .paddingInner(1)
        .paddingOuter(0.5);
      // Add x axis
      svg.append("g")
        .attr("id", `gXAxis-${attribute}`)
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
  
      // Title
      svg.append("text")
      .attr("text-anchor", "middle")
      .attr("x", width/2)
      .attr("y", -15)
      .text(key);
  
      //Y scale
      const y = d3.scaleLinear()
        .domain(yscales[attribute])
        .range([height, 0]);
      // Add y axis
      svg.append("g")
         .attr("id", `gYAxis-${attribute}`)
         .call(d3.axisLeft(y)) 
  
  
      const color = myColor.domain(yscales[attribute].slice().reverse());
  
      // Draw the plot
      svg
        .selectAll(`circle.indPoints-${attribute}`)
        .data(data, (d) => d.name)
        .join("circle")
        .attr("class", `indPoints-${attribute} itemValue`)
        .attr("cx", (d) => x(d.category) - jitterWidth/2 + Math.random()*jitterWidth ) // onde se calculam as categorias 
        .attr("cy", (d) => y(d[key]))
        .attr("r", 3.5)
        .style("fill", (d) => color(d[key]))
        .style("stroke", "black");
        // .on("mouseover", (event, d) => handleMouseOver(d))
        // .on("mouseleave", (event, d) => handleMouseLeave())
        // .append("title")
        // .text((d) => d.title);
    });
}
  
function updateJitterPlots(attribute, column, category1, category2){
    const margin = {top: 40, right: 40, bottom: 40, left: 90},
        width = 315 - margin.left - margin.right,
        height = 200 - margin.top - margin.bottom;
    
    d3.csv('nutrition.csv').then(function(data) {
  
      data = data.filter(function (item) {
        return item.category === category1 || item.category === category2;
      });
  
      const key = getKey(data, attribute);
  
      console.log(category2);
      console.log(data);
  
      const svg = d3.select(`#gJitterPlot-${attribute}`);
  
      // update X scale
      const x = d3.scaleBand()
        .range([0, width])
        .domain([category1, category2])
        .paddingInner(1)
        .paddingOuter(.5);
      svg
        .select(`#gXAxis-${attribute}`)
        .call(d3.axisBottom(x))
  
      //Y scale
      const y = d3.scaleLinear()
        .domain(yscales[attribute])
        .range([height, 0])
  
      svg.select(`#gYAxis-${attribute}`).call(d3.axisLeft(y));
  
      const color = myColor.domain(yscales[attribute].slice().reverse());
  
      // Update the plot
      svg
        .selectAll(`circle.indPoints-${attribute}`)
        .data(data, (d) => d.name)
        .join(
          (enter) => {
            circles = enter
              .append("circle")
              .attr("class", `indPoints-${attribute} itemValue`)
              .attr("cx", function(d){return(x(d.category) - jitterWidth/2 + Math.random()*jitterWidth )})
              .attr("cy", y(0))
              .attr("r", 4)
              .style("fill", function(d){ return(color(d[key]))})
              .style("stroke", "black")
              // .on("mouseover", (event, d) => handleMouseOver(d))
              // .on("mouseleave", (event, d) => handleMouseLeave());
            circles
              .transition()
              .duration(1000)
              .attr("cy", function(d){return(y(d[key]))});
            circles.append("title").text((d) => d.name);
          },
          (update) => {
            update
              .transition()
              .duration(1000)
              .attr("cx", function(d){return(x(d.category) - jitterWidth/2 + Math.random()*jitterWidth )})
              .attr("cy", function(d){return(y(d[key]))})
              .attr("r", 3.5);
          },
          (exit) => {
            exit.remove();
          }
        );
    })
}
  
  
function handleMouseOver(item) {
    d3.selectAll(".TreeItemValue")
    .filter(function (d, i) {
      return d.data.parent == item.data.parent;
    })
    .style("stroke", "black")
    .style("stroke-width", 2);

}
  
function handleMouseLeave() {
  
    // prepare a color scale
    var color = d3.scaleOrdinal()
    .domain(["Vegetables", "Meat", "Dairy", "Others", "Fish", "Fruits", "Starchy food","Fast food","Oils","Beverages"])
    .range([ "#098526", "#fa050d", "#f72ae3","#030000", "#05005c", "#011f06","#402D54", "#D18975", "#838701","#001202"])
  
    // And a opacity scale
    var opacity = d3.scaleLinear()
      .domain([10, 30])
      .range([0.6,1])
  
    d3.selectAll(".TreeItemValue")
    .style("fill", function(d){ return color(d.data.parent)} )
    .style("opacity", function(d){ return opacity(d.data.quantity)})
    .style("stroke", "none");
}

function getKey(data, attribute){
    var keys = Array.from(Object.keys(data[0]));
    var pattern = new RegExp("^" + attribute + "[\ ]");
    return keys.filter(function(k){return k.match(pattern);});
}


function onClickers(item){
  d3.selectAll(".TreeItemValue")
    console.log("Category - ",item.data.parent)
    console.log("Type - ",item.data.child)
    console.log("Quantity - ",item.data.quantity)
}