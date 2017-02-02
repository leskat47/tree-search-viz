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

    const circleDelay = 1000;

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
    var node = g.selectAll("circle .node")
        .data(nodes.descendants())
      .enter().append("g")
        .attr("class", (d) => "node")
        .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
        .attr("id", (d) => d.data.name);

    // adds the circle to the node
    node.append("circle")
      .attr("r", 10)
      .classed("plain", true);

    // adds the text to the node
    node.append("text")
      .attr("dy", ".35em")
      .attr("y", (d) => d.children ? -20 : 20) // place text above circle unless it's the bottom/last node
      .text(d => d.data.name);

  }

  // Change circles' appearance per status attributes
  function updateCircles() {

    d3.selectAll(".node circle")
        .classed("to-find", (d) => d.toFind || false)
        .classed("selected", (d) => d.isSelected || false)
        .classed("to-check", (d) => d.toBeChecked || false)
        .classed("done", (d) => d.done || false);
  }


  // Change searching text to show status
  function updateTrackingText(nodesToVisit, current){

    d3.select("#list").text(nodesToVisit.join(", "));
    d3.select("#current-check").text(current);
  }


  // Animation when node is found
  function pulseFoundCircle(circle) {

    circle.transition()
      .duration(500)
      .attr("class", "found")
      .attr("r", 50)
      .transition()
      .duration(500)
      .attr("r", 10);
  }


  // Set up breadth first search. Starts at root node.
  function initSearch(evt) {

    var searchText = d3.select("input").property("value");
    console.log(searchText);
    resetCirclesDisplay();

    d3.select(this).style("font-weight", "bold");
    debugger;

    d3.select("#" + searchText + " circle").classed("to-find", true).datum().searchText = true;

    // Start at the first node
    var current = d3.select("#Dumbledore");
    var checkList = [];
    current.datum().isSelected = true;
    updateCircles();
    updateTrackingText(["Dumbledore"], "Dumbledore");

    if (this.value === "breadth") {
      setTimeout(() => treeSearch(current, searchText, checkList, "breadth"), 1000);
    } else if (this.value === "depth"){
      setTimeout(() => treeSearch(current, searchText, checkList, "depth"), 1000);
    }
  }

  /*
   * Search for the matching node for the toFind value. Recursive function adds
   * child nodes to the end of the queue until the first item in the queue has
   * the same name value as toFind.
  */
  function treeSearch(current, toFind, checkList, type) {
    var currentNode = current.datum()
    // Base case: Pulse current node and return
    if (currentNode.data.name === toFind) {
      pulseFoundCircle(current.select("circle"));
        d3.select("#" + type).style("font-weight", "normal");
      return;
    }

    currentNode.toBeChecked = false;
    currentNode.isSelected = true;

    var children = d3.select("#" + currentNode.data.name).datum().children || [];

    // set children of current node to toBeChecked and add to queue
    children.forEach(function(element) {
      d3.select("#" + element.data.name).datum().toBeChecked = true;
      checkList.push(element.data.name);
    });

    // Update display with current active node and children
    updateCircles();

    // Take next items to be checked based on type of search
    setTimeout(function() {
      if (type === "breadth") {
      // Dequeue first item and set to current.
        updateTrackingText(checkList, checkList[0]);
        current = d3.select("#" + checkList.shift());
      } else if (type === "depth") {
      // Pop last item and set to current.
        updateTrackingText(checkList, checkList[checkList.length - 1]);
        current = d3.select("#" + checkList.pop());
      }
    }, 2500);

    // Change current node status to done. Update display.
    currentNode.isSelected = false;
    currentNode.done = true;
    setTimeout(updateCircles, circleDelay);

    setTimeout(() => treeSearch(current, toFind, checkList, type), 3000);
  }

  /*
   * On click of the reset button, clear out attributes on nodes and return
   * the graph to the original state.
  */
  function resetCirclesDisplay() {
    d3.select("#graph").html("");
    buildTree();
    // document.getElementsByTagName('input')[0].value = "";
    // var nodes = d3.selectAll(".node");
    // nodes.selectAll("circle")

    // d3.select("#list").text("");
    // d3.select("#current-check").text("");

    // nodes.each(function(d) {
    //   d.toBeChecked = false;
    //   d.isSelected = false;
    //   d.done = false;
    //   d.toFind = false;
    // });

    // updateCircles();
    // d3.select(".found").classed("found", false).classed("plain", true);
  }


  buildTree();

  // Event listeners
  d3.selectAll(".start-search-button").on("click", initSearch);
  d3.select("#reset").on("click", resetCirclesDisplay);

}());
