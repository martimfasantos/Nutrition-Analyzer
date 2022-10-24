const margin = {top: 40, right: 40, bottom: 40, left: 90},
      width = 315 - margin.left - margin.right,
      height = 200 - margin.top - margin.bottom;

const jitterWidth = 35
const LEFT = 0,
      RIGHT = 1;

const myColor1 = d3.scaleSequential()
                  .interpolator(d3.interpolateInferno)
                  .domain([,0]);

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
                  "fat" : [0, 200],
                  "protein" : [0, 70],
                  "carbohydrates" : [0, 100],
                  "sodium" : [0, 3000],
                  "potassium" : [0, 1800]
};


function init(){
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


function createJitterPlot(attribute, category1, category2){
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


    const myColor = d3.scaleSequential()
                  .interpolator(d3.interpolateInferno)
                  .domain(yscales[attribute].reverse());

    // Draw the plot
    svg
      .selectAll(`circle.indPoints-${attribute}`)
      .data(data, (d) => d.name)
      .join("circle")
      .attr("class", `indPoints-${attribute} itemValue`)
      .attr("cx", (d) => x(d.category) - jitterWidth/2 + Math.random()*jitterWidth ) // onde se calculam as categorias 
      .attr("cy", (d) => y(d[key]))
      .attr("r", 3.5)
      .style("fill", (d) => myColor(d[key]))
      .style("stroke", "black");
      // .on("mouseover", (event, d) => handleMouseOver(d))
      // .on("mouseleave", (event, d) => handleMouseLeave())
      // .append("title")
      // .text((d) => d.title);
  });
}

function updateJitterPlots(attribute, column, category1, category2){
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

    svg.select(`#gYAxis-${attribute}`).call(d3.axisLeft(y)) 

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
            .style("fill", function(d){ return(myColor(d[key]))})
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

function getKey(data, attribute){
  var keys = Array.from(Object.keys(data[0]));
  var pattern = new RegExp("^" + attribute + "[\ ]");
  return keys.filter(function(k){return k.match(pattern);});
}