(function () {
  'use strict';

  const treeData =
    {
      name: "Dumbledore",
      children: [
        {
          "name": "Flitwick",
          "children": [
            { "name": "Padma"},
          ],
        },
        {
          name: "McGonagall",
          children: [
            {
              name: "Ron",
              children: [
                {name: "Seamus"},
                {name: "Neville"},
              ],
            },
            { name: "Hermione",
              children: [
                {name: "Pavarti"},
                {name: "Lavendar"},
              ],
            },
          ],
        },
        { name: "Snape",
          children: [
            {name: "Malfoy",
              children: [
                {name: "Crabbe"},
                {name: "Goyle"},
              ],
            },
          ],
        },
      ],
    };

  function buildTree () {
    // set the dimensions and margins of the diagram
    var margin = {top: 40, right: 90, bottom: 50, left: 90};
    var width = 660 - margin.left - margin.right;
    var height = 500 - margin.top - margin.bottom;

    // declares a tree layout and assigns the size
    var treemap = d3.tree()
        .size([width, height]);

    //  assigns the data to a hierarchy using parent-child relationships
    var nodes = d3.hierarchy(treeData);

    // maps the node data to the tree layout
    nodes = treemap(nodes);

    // append the svg obgect to the body of the page
    // appends a 'group' element to 'svg'
    // moves the 'group' element to the top left margin
    var svg = d3.select("#graph").append("svg")
          .attr("width", width + margin.left + margin.right)
          .attr("height", height + margin.top + margin.bottom),
        g = svg.append("g")
          .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

    // adds the links between the nodes
    var link = g.selectAll(".link")
        .data( nodes.descendants().slice(1))
      .enter().append("path")
        .attr("class", "link")
        .attr("d", (d) =>
           "M" + d.x + "," + d.y +
           "C" + d.x + "," + (d.y + d.parent.y) / 2 +
            " " + d.parent.x + "," +  (d.y + d.parent.y) / 2 +
            " " + d.parent.x + "," + d.parent.y
        );

    // adds each node as a group
    var node = g.selectAll(".node")
        .data(nodes.descendants())
      .enter().append("g")
        .attr("class", (d) => "node")
        .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
        .attr("id", (d) => d.data.name);

    // adds the circle to the node
    node.append("circle")
      .attr("r", 10)

    // adds the text to the node
    node.append("text")
      .attr("dy", ".35em")
      .attr("y", (d) => d.children ? -20 : 20) // place text above circle unless it's the bottom/last node
      .text(d => d.data.name);

  }

  // Change circles' appearance per status attributes
  function updateCircles() {

    d3.selectAll(".node circle")
      .transition()
        .style("stroke", (d) =>
          d.done ? "lightgray"
          : d.toFind ? "red"
          : null)
        .style("fill", (d) => 
          d.isSelected ? "steelblue"
          : d.toBeChecked ? "lightblue"
          : d.done ? "white"
          : null
        );
  }

  
  // Change searching text to show status
  function updateText(queueList, current){

    d3.select("#list").text(queueList.join(", "));
    d3.select("#current-check").text(current);
  }


  // Animation when node is found
  function pulse(node) {
    
    node.transition()
      .duration(500)
      .style("fill", "red")
      .attr("r", 50)
      .transition()
      .duration(500)
      .attr("r", 10);
  }


  // Set up breadth first search. Starts at root node.
  function initSearch(evt) {

    var toFind = d3.select("input").property("value");
    reset();
    document.getElementsByTagName('input')[0].value = toFind;

    d3.select(this).style("font-weight", "bold");

    d3.select("#" + toFind).select("circle").style("stroke", "red").datum().toFind = true;

    // Start at the first node
    var current = d3.select("#Dumbledore");
    var checkList = [];
    current.datum().isSelected = true;
    updateCircles();
    updateText(["Dumbledore"], "Dumbledore");

    if (this.value === "breadth") {
      setTimeout(() => treeSearch(current, toFind, checkList, "breadth"), 1000);
    } else if (this.value === "depth"){
      setTimeout(() => treeSearch(current, toFind, checkList, "depth"), 1000);
    }
  }

  /* 
   * Search for the matching node for the toFind value. Recursive function adds 
   * child nodes to the end of the queue until the first item in the queue has 
   * the same name value as toFind.
  */
  function treeSearch(current, toFind, checkList, type) {

    // Base case: Pulse current node and return
    if (current.datum().data.name === toFind) {
      pulse(current.select("circle"));
        d3.select("#" + type).style("font-weight", "normal");
      return;

    } else {
      current.datum().toBeChecked = false;
      current.datum().isSelected = true;

      var children = d3.select("#" + current.datum().data.name).datum().children || [];
      
      // set children of current node to toBeChecked and add to queue
      for (var i=0; i<children.length; i++) {
        d3.select("#" + children[i].data.name).datum().toBeChecked = true;
        checkList.push(children[i].data.name);
      }
      
      // Update display. Set current node to done
      setTimeout(() => updateCircles(), 500);
      current.datum().isSelected = false;
      current.datum().done = true;
      updateText(checkList, checkList[0]);

      // Take next items to be checked based on type of search
      if (type === "breadth") {
        // Dequeue first item and set to current.
        current = d3.select("#" + checkList.shift());
      } else if (type === "depth") {
        updateText(checkList, checkList.slice(-1)[0]);
        // Pop last item and set to current.
        current = d3.select("#" + checkList.pop());
      }

      current.datum().isSelected = true;
      setTimeout(() => updateCircles(), 500);
      setTimeout(() => treeSearch(current, toFind, checkList, type), 3000);
    }
  }

  /* 
   * On click of the reset button, clear out attributes on nodes and return 
   * the graph to the original state.
  */
  function reset() {
    document.getElementsByTagName('input')[0].value = "";
    var nodes = d3.selectAll(".node");
    nodes.selectAll("circle")
    .style("fill", "white")
    .style("stroke", "steelblue");

    d3.select("#list").text("");
    d3.select("#current-check").text("");

    nodes.each(function(d) {
      d3.select(this).datum().toBeChecked = false;
      d3.select(this).datum().isSelected = false;
      d3.select(this).datum().done = false;
    });
  }


  buildTree();

  // Event listeners
  d3.selectAll(".start-search-button").on("click", initSearch);
  d3.select("#reset").on("click", reset);

}());