// Parallel Coordinates

var width = 1550,
    height = 500;

    
var m = [60, 0, 10, 0],
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

const colors = {
  "Beverages": [10,28,67],
  "Dairy": [325,50,39],
  "Fast food": [60,86,61],
  "Fish": [37,50,75],
  "Fruits": [271,39,57],
  "Meat": [185,56,73],
  "Oils": [28,100,52],
  "Others": [318,65,67],
  "Starchy food": [30,100,73],
  "Vegetables": [56,58,73]
};

const filters = new Map();

// Scale chart and canvas height
d3.select("#chart")
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
var svg = d3.select("svg")
    .attr("width", w + m[1] + m[3])
    .attr("height", h + m[0] + m[2])
    .append("g")
    .attr("transform", `translate(${m[3]},${m[0]})`);

// Load the data and visualization
d3.csv("test.csv").then(function (raw_data) {
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

// render polylines i to i+render_speed 
function render_range(selection, i, max, opacity) {
  selection.slice(i,max).forEach(function(d) {
    path(d, foreground, color(d.category, opacity));
  });
};

// simple data table
function data_table(sample) {
  // sort by first column
  var sample = sample.sort(function(a,b) {
    var col = Object.keys(a)[0];
    return a[col] < b[col] ? -1 : 1;
  });

  var table = d3.select("#food-list")
    .html("")
    .selectAll(".row")
      .data(sample)
    .enter().append("div")
      .on("mouseover", (event, d) => highlight(d))
      .on("mouseout", (event, d) => unhighlight());

  table
    .append("span")
      .attr("class", "color-block")
      .style("background", function(d) { return color(d.category, 0.85) })

  table
    .append("span")
      .text(function(d) { return d.name; })
}

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
  var c = colors[d];
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

  // free text search
  var query = d3.select("#search").node().value;
  if (query.length > 0) {
    selected = search(selected, query);
  }

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

  data_table(shuffled_data.slice(0,25));

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