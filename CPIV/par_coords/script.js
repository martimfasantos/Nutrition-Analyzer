const width = 1450,
      height = 410;

var m = [50, 0, 10, 0],
    w = width - m[1] - m[3],
    h = height - m[0] - m[2],
    xscale,
    yscale = {},
    dragging = {},
    line = d3.line(),
    axis = d3.axisLeft().ticks(1+height/50),
    data,
    foreground,
    background,
    highlighted,
    dimensions,                           
    legend,
    render_speed = 50,
    brush_count = 0,
    excluded_groups = [];

const jitterWidth = 20;
const LEFT = 0,
      RIGHT = 1;

const categories = ["Meat",
                    "Fish",
                    "Fruits",
                    "Dairy",
                    "Vegetables",
                    "Starchy food",
                    "Fast food",
                    "Beverages",
                    "Oils",
                    "Others"];

                    // TO ADJUST
const yscales = { "calories" : [0, 1000],
                  "fat" : [0, 120],
                  "protein" : [0, 70],
                  "carbohydrates" : [0, 110],
                  "sodium" : [0, 5000],
                  "potassium" : [0, 3000]
};

var selected_category;

const colorsHSL = {
  "Meat": [3,100,69],
  "Fish": [212.1, 44.7, 63.1],
  "Vegetables": [120, 60, 66.7],
  "Beverages": [187,75,86],
  "Fruits": [138.1, 96.9, 38.2],
  "Dairy": [29, 91, 79],
  "Fast food": [315, 61, 70],
  "Oils": [146, 3, 54],
  "Others": [78, 36, 73],
  "Starchy food": [260.7, 44.5, 73.1]
};

const colorsHEX = {
  "Meat": "#ff6961",
  "Fish": "#779ecb",
  "Vegetables": "#77dd77",
  "Beverages": "#c1f0f6",
  "Fruits": "#03c03c",
  "Dairy": "#fac898",
  "Fast food": "#e183c9",
  "Oils": "#858c88",
  "Others": "#c4d3a2",
  "Starchy food": "#b19cd9"
};

const filters = new Map();

function init(){
  createParCoords("#parCoords");
  createTreeMap("#treemap");
  createJitterPlot("calories");
  createJitterPlot("fat");
  createJitterPlot("protein");
  createJitterPlot("carbohydrates");
  createJitterPlot("sodium");
  createJitterPlot("potassium");
}

function createParCoords(id){

  // Scale chart and canvas height
  d3.select(id)
      .style("height", (h + m[0] + m[2]) + "px")
  
  d3.selectAll("canvas")
      .attr("width", w)
      .attr("height", h)
      .style("padding", m.join("px ") + "px");
  
  
  // Foreground canvas for primary view
  foreground = document.getElementById('foreground').getContext('2d');
  foreground.globalCompositeOperation = "destination-over";
  foreground.strokeStyle = "rgba(0,100,160,0.1)";
  foreground.lineWidth = 1.7;
  foreground.fillText("Loading...",w/2,h/2);
  
  // Highlight canvas for temporary interactions
  highlighted = document.getElementById('highlight').getContext('2d');
  highlighted.strokeStyle = "rgba(0,100,160,1)";
  highlighted.lineWidth = 4;
  
  // Background canvas
  background = document.getElementById('background').getContext('2d');
  background.strokeStyle = "rgba(0,100,160,0.1)";
  background.lineWidth = 1.7;
  
  // SVG for ticks, labels, and interactions
  var svg = d3
      .select("svg")
      .attr("width", w + m[1] + m[3])
      .attr("height", h + m[0] + m[2])
      .append("g")
      .attr("transform", `translate(${m[3]},${m[0]})`);
  
  // Load the data and visualization
  d3.csv("nutrition.csv").then(function (raw_data) {
    // Convert quantitative scales to floats
    data = raw_data.map(function(d) {
      for (var k in d) {
        if (!_.isNaN(raw_data[0][k] - 0) && k != 'name') {
          d[k] = parseFloat(d[k]) || 0;
        }
      };
      return d;
    });
  
    dimensions = Object.keys(raw_data[0]).filter(function(d) { return d != "name" && d != "type" && d != "description" && d != "category" && d != "serving_size (g)" 
    && d != "calories_daily_intake_percentage" && d != "fat_percentage" && d != "sodium_daily_intake_percentage" && d != "calcium (mg)" && d != "magnesium (mg)" && d != "protein_percentage" 
    && d != "protein_daily_intake_percentage" && d != "carbohydrate_daily_intake_percentage" && d != "alcohol" && d != "water_percentage_serving_size" && d != "caffeine (mg)"})
  
    // Extract the list of numerical dimensions and create a scale for each.
    for (i in dimensions) {
      attr = dimensions[i]
      yscale[attr] = d3.scaleLinear()
        .domain(d3.extent(data, function(d) { return +d[attr]; }))
        .range([h, 0]);
    }
  
    // Build the x scale
    xscale = d3.scalePoint()
      .range([0, w])
      .padding(0.75)
      .domain(dimensions);
  
    // Add a group element for each dimension.
    var g = svg
        .selectAll(".dimension")
        .data(dimensions)
        .enter()
        .append("g")
        .attr("class", "dimension")
        .attr("transform", function(d) { return `translate(${xscale(d)})`; });
  
    // Add an axis and title.
    g.append("g")
      .attr("class", "axis")
      .attr("transform", `translate(0,0)`)
      .each(function(d) { d3.select(this).call(axis.scale(yscale[d])); })
      .append("text")
      .attr("text-anchor", "middle")
      .attr("y", function(d,i) { return i%2 == 0 ? -14 : -30 } )
      .attr("x", 0)
      .attr("class", "label")
      .text(String)
  
    // Add and store a brush for each axis.
    g.append("g")
        .attr("class", "brush")
        .each(function(d) { d3.select(this)
                              .call(yscale[d].brush = d3.brushY()
                                                        .extent( [ [-20,0], [20, h] ])
                                                        .on("start brush end", brushed)); })    
        .append("title")
          .text("Drag up or down to brush along this axis");
  
    // Render full foreground
    svg.call(brushed);
  
  });
}

// render polylines i to i+render_speed 
function render_range(selection, i, max, opacity) {
  selection.slice(i,max).forEach(function(d) {
    path(d, foreground, color(d.category, opacity));
  });
};

// Adjusts rendering speed 
function optimize(timer) {
  var delta = (new Date()).getTime() - timer;
  render_speed = Math.max(Math.ceil(render_speed * 30 / delta), 8);
  render_speed = Math.min(render_speed, 300);
  return (new Date()).getTime();
}

// Feedback on rendering progress
function render_stats(i,n,render_speed) {
  d3.select("#rendered-count").text(i);
  d3.select("#rendered-bar")
    .style("width", (100*i/n) + "%");
  d3.select("#render-speed").text(render_speed);
}

// Feedback on selection
function selection_stats(opacity, n, total) {
  d3.select("#data-count").text(total);
  d3.select("#selected-count").text(n);
  d3.select("#selected-bar").style("width", (100*n/total) + "%");
  d3.select("#opacity").text((""+(opacity*100)).slice(0,4) + "%");
}

// Highlight single polyline
function highlight(d) {
  d3.select("#foreground").style("opacity", "0.25");
  d3.selectAll(".row").style("opacity", function(p) { return (d.category == p) ? null : "0.3" });
  path(d, highlighted, color(d.category,1));
}

// Remove highlight
function unhighlight() {
  d3.select("#foreground").style("opacity", null);
  d3.selectAll(".row").style("opacity", null);
  highlighted.clearRect(0,0,w,h);
}

function path(d, ctx, color) {
  if (color) ctx.strokeStyle = color;
  ctx.beginPath();
  var x0 = xscale(0)-15,
      y0 = yscale[dimensions[0]](d[dimensions[0]]);   // left edge
  ctx.moveTo(x0,y0);
  dimensions.map(function(p,i) {
    if (i === 0) var x = xscale(p) - 8
    else var x = xscale(p);
    var y = yscale[p](d[p]);
    var cp1x = x - 0.92*(x-x0);
    var cp1y = y0;
    var cp2x = x - 0.08*(x-x0);
    var cp2y = y;
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
    x0 = x;
    y0 = y;
  });
  ctx.lineTo(x0, y0);                               // right edge
  ctx.stroke();
};

function color(d,a) {
  var c = colorsHSL[d];
  return ["hsla(",c[0],",",c[1],"%,",c[2],"%,",a,")"].join("");
}

function position(d) {
  var v = dragging[d];
  return v == null ? xscale(d) : v;
}

// Handles a brush event, toggling the display of foreground lines.
function brushed({selection}, key) {
  brush_count++;
  if (selection === null) filters.delete(key);
  else if (Array.isArray(selection)) {
    filters.set(key, selection.map(function(d){ return yscale[key].invert(d); }));
  }
  var actives = Array.from(filters).map(function(entry){ return entry[0]; });
  var extents = Array.from(filters).map(function(entry){ return entry[1]; });

  // hack to hide ticks beyond extent
  if (d3.selectAll('.dimension')[0]){
    var b = d3
      .selectAll('.dimension')[0]
      .forEach(function(element) {
        var dimension = d3.select(element).data()[0];
        if (_.include(actives, dimension)) {
          var extent = extents[actives.indexOf(dimension)];
          d3.select(element)
            .selectAll('text')
            .style('font-weight', 'bold')
            .style('font-size', '13px')
            .style('display', function() { 
              var value = d3.select(this).data();
              return extent[0] <= value && value <= extent[1] ? null : "none"
            });
        } else {
          d3.select(element)
            .selectAll('text')
            .style('font-size', null)
            .style('font-weight', null)
            .style('display', null);
        }
        d3.select(element)
          .selectAll('.label')
          .style('display', null);
      });
  }
 
  // bold dimensions with label
  d3.selectAll('.label')
    .style("font-weight", function(dimension) {
      if (_.include(actives, dimension)) return "bold";
      return null;
    });

  // Get lines within extents
  var selected = [];
  data.map(function(d) {
    return actives.every(function(p, dimension) {
      return extents[dimension][0] >= d[p] && d[p] >= extents[dimension][1];
    }) ? selected.push(d) : null;
  });

  // Render selected lines
  paths(selected, foreground, brush_count, true);
}

// render a set of polylines on a canvas
function paths(selected, ctx, count) {
  var n = selected.length,
      i = 0,
      opacity = d3.min([2/Math.pow(n,0.3),1]),
      timer = (new Date()).getTime();

  selection_stats(opacity, n, data.length)

  shuffled_data = _.shuffle(selected);

  ctx.clearRect(0,0,w+1,h+1);

  // render all lines until finished or a new brush event
  function animloop(){
    if (i >= n || count < brush_count) return true;
    var max = d3.min([i+render_speed, n]);
    render_range(shuffled_data, i, max, opacity);
    render_stats(max,n,render_speed);
    i = max;
    timer = optimize(timer);  // adjusts render_speed
  };

  d3.timer(animloop);
}

function search(selection,str) {
  pattern = new RegExp(str,"i")
  return _(selection).filter(function(d) { return pattern.exec(d.name); });
}

function createTreeMap(id) {
  const margin = { top: -10, right: 0, bottom: 0, left: 40 },
          width = 520 - margin.left - margin.right,
          height = 870 - margin.top - margin.bottom;

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
                  .domain(Object.keys(colorsHEX))
                  .range(Object.values(colorsHEX))

      // And a opacity scale
      var opacity = d3.scaleLinear()
                .domain([10, 35])
                .range([0.5,1])

      svg
        .selectAll("rect.rectValue")
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
          .on("click", (event, d) => onClickTreeMap(d));

      // and to add the text labels (types)
      svg
      .selectAll("text")
      .data(root.leaves())
      .enter()
      .append("text")
        .attr("x", function(d){ return d.x0+2})    // +1 to adjust position (more right)
        .attr("y", function(d){ return d.y0+13})    // +15 to adjust position (lower)
        .text(function(d){ return d.data.child })
        .attr("font-size", "13px")
        .attr("fill", "white");

      // and to add the text labels (quantities)
      svg
        .selectAll("vals")
        .data(root.leaves())
        .enter()
        .append("text")
          .attr("x", function(d){ return d.x0+3})    // +5 to adjust position (more right)
          .attr("y", function(d){ return d.y0+25})    // +26 to adjust position (lower)
          .text(function(d){ return d.data.quantity })
          .attr("font-size", "11px")
          .attr("fill", "white");

      // Add title for the groups
      svg
      .selectAll("titles")
      .data(root.descendants().filter(function(d){return d.depth==1}))
      .enter()
      .append("text")
        .attr("x", function(d){ return d.x0})
        .attr("y", function(d){ return d.y0+12})
        .text(function(d){ return d.data.child })
        .attr("font-size", "14px")
        .attr("fill", "#303030")
        .attr("font-weight", "bold")

      d3.selectAll(".TreeItemValue")
        .filter(function (d, i) {
          return d.data.parent == selected_category;
        })
        .style("stroke", "black")
        .style("stroke-width", 2.5);
  });
}

function createJitterPlot(attribute){
  const margin = {top: 20, right: 40, bottom: 30, left: 40},
      width = 480 - margin.left - margin.right,
      height = 225 - margin.top - margin.bottom;
    
  const svg = d3
    .select(`#jitterPlot-${attribute}`)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("id", `gJitterPlot-${attribute}`)
    .attr("transform", `translate(${margin.left},${margin.top})`);

  d3.csv('nutrition.csv').then(function(data) {
    
    const key = getKey(data, attribute);

    // X scale
    const x = d3.scaleBand()
      .range([0, width])
      .domain(categories)
      .paddingInner(1)
      .paddingOuter(0.5);

    // Add x axis and change the pos of its ticks lables 
    svg.append("g")
      .attr("id", `gXAxis-${attribute}`)
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x))
      .selectAll("text")  
      .style("text-anchor", "middle")
      .attr("transform", function(d,i) { return i%2 == 0 ? `translate(0,0)` : `translate(0,10)`; });

    // Title
    svg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", width/2)
    .attr("y", -5)
    .text(key);

    //Y scale
    const y = d3.scaleLinear()
      .domain(yscales[attribute])
      .range([height, 0]);
    // Add y axis
    svg.append("g")
       .attr("id", `gYAxis-${attribute}`)
       .call(d3.axisLeft(y)) 

    // Draw the plot
    svg
      .selectAll(`circle.indPoints-${attribute}`)
      .data(data, (d) => d.name)
      .join("circle")
      .attr("class", `indPoints-${attribute} JitterItemValue`)
      .attr("cx", (d) => x(d.category) - jitterWidth/2 + Math.random()*jitterWidth ) // onde se calculam as categorias 
      .attr("cy", (d) => y(d[key]))
      .attr("r", 3.5)
      .style("fill", (d) => color(d.category,1))
      .style("stroke", "#202020")
      .on("mouseover", (event, d) => handleMouseOverJitter(d))
      .on("mouseleave", (event, d) => handleMouseLeaveJitter())
      .append("title")
        .text((d) => d.name);

    d3.csv('references.csv').then(function(rdata) {

      const reference = Object.keys(rdata[0]).filter((k) => k == key),
            reference_value = rdata[0][reference]/4;

      // Trend line
      svg.append('line')
        .style("stroke", "#ff8f16")
        .style("stroke-width", height/180)
        .style("stroke-dasharray", ("2, 2"))
        .attr("x1", x(0))
        .attr("y1", y(reference_value))
        .attr("x2", width)
        .attr("y2", y(reference_value))
    });
  });
}

function handleMouseOver(item) {
  d3.selectAll(".TreeItemValue")
    .filter(function (d, i) {
      return d.data.parent == item.data.parent && item.data.parent != selected_category;
    })
    .style("stroke", "#454545")
    .style("stroke-width", 2);

}

function handleMouseLeave() {

  // prepare a color scale
  var color = d3.scaleOrdinal()
      .domain(Object.keys(colorsHEX))
      .range(Object.keys(colorsHEX));

  // And a opacity scale
  var opacity = d3.scaleLinear()
    .domain([10, 30])
    .range([0.6,1])

  d3.selectAll(".TreeItemValue")
    .filter(function (d, i) {
      return d.data.parent != selected_category;
    })
    .style("fill", function(d){ return color(d.data.parent)} )
    .style("opacity", function(d){ return opacity(d.data.quantity)})
    .style("stroke", "none");
}

function handleMouseOverJitter(item){
  console.log("OVER");
  console.log(d3.selectAll(".JitterItemValue").filter(function (d, i) {
    return d.name == item.name;
  }));
  d3.selectAll(".JitterItemValue")
    .filter(function (d, i) {
      return d.name == item.name;
    })
    .style("stroke", colorsHEX[item.category])
    .style("stroke-width", 10);
}

function handleMouseLeaveJitter(){
  d3.selectAll(".JitterItemValue")
    .style("stroke", "#202020")
    .style("stroke-width", 1);
}

function getKey(data, attribute){
  var keys = Array.from(Object.keys(data[0]));
  var pattern = new RegExp("^" + attribute + "[\ ]");
  return keys.filter(function(k){return k.match(pattern);});
}

function onClickTreeMap(item){
  d3.selectAll(".TreeItemValue")
  .style("stroke", "none");

  d3.selectAll(".TreeItemValue")
    .filter(function (d, i) {
      return d.data.parent == item.data.parent;
    })
    .style("stroke", "black")
    .style("stroke-width", 2.5);

  selected_category = item.data.parent;
  updateAllJitterPlots(selected_category);
}