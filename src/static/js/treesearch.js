(function () {
  'use strict';


  ///////////////////////////////////////////////////////////////////////////////
  // Global data

  /* Function to build nodes for tree */

  function P(name, children) {
    return { name: name, children: children };
  }


  const TREE_DATA =
    P("Dumbledore", [
      P("Flitwick", [
        P("Padma"),
      ]),
      P("McGonagall", [
        P("Ron", [
          P("Seamus"),
          P("Neville"),
        ]),
        P("Hermoine", [
          P("Pavarti"),
          P("Lavendar"),
        ]),
      ]),
      P("Snape", [
        P("Malfoy", [
          P("Crabbe"),
          P("Goyle"),
        ])
      ])
    ]);

  const CIRCLEDELAY = 500;
  const TEXTDELAY = 2.5 * CIRCLEDELAY;
  const NEXTNODEDELAY = 3 * CIRCLEDELAY;

  const CIRCLE_RADIUS = 10;
  const SVG_HEIGHT = 500;
  const SVG_WIDTH = 660;


  ///////////////////////////////////////////////////////////////////////////////
  // Setup Tree

  /* buildTree: Create d3 tree and append data */

  function buildTree (treeData) {

    // set the dimensions and margins of the diagram
    const treeMargin = {top: 40, right: 90, bottom: 50, left: 90};
    const treeWidth = SVG_WIDTH - treeMargin.left - treeMargin.right;
    const treeHeight = SVG_HEIGHT - treeMargin.top - treeMargin.bottom;

    // append the svg obgect to the body of the page
    const svg = d3.select("#graph").append("svg")
          .attr("width", SVG_WIDTH)
          .attr("height", SVG_HEIGHT);

    // append a 'group' element to 'svg' adjust location to be within tree area
    const g = svg.append("g")
          .attr("transform",
                "translate(" + treeMargin.left + "," + treeMargin.top + ")");

    // declare a tree layout and assigns the size
    const treemap = d3.tree()
        .size([treeWidth, treeHeight]);

    //  assign the data to a hierarchy using parent-child relationships
    // map the node data to the tree layout
    const nodes = treemap(d3.hierarchy(treeData));


    // add links between the nodes
    const link = g.selectAll(".link")
        .data( nodes.descendants().slice(1))
      .enter().append("path")
        .attr("class", "link")
        .attr("d", (d) =>
           "M" + d.x + "," + d.y +
           "C" + d.x + "," + (d.y + d.parent.y) / 2 +
            " " + d.parent.x + "," +  (d.y + d.parent.y) / 2 +
            " " + d.parent.x + "," + d.parent.y
        );

    // add each node as a group
    const node = g.selectAll("circle .node")
        .data(nodes.descendants())
      .enter().append("g")
        .attr("class", (d) => "node")
        .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
        .attr("id", (d) => d.data.name);

    // add the circle to the node
    node.append("circle")
      .attr("r", CIRCLE_RADIUS);


    // add the text to the node
    // place label above circle unless it's the bottom/last node
    node.append("text")
      .attr("dy", ".35em")
      .attr("y", (d) => d.children ? -20 : 20)
      .text(d => d.data.name);
  }

  ///////////////////////////////////////////////////////////////////////////////
  // Handle visual updating before & during searching

  /* updateCircles: Change circles' appearance per status attributes */

  function updateCircles() {

    d3.selectAll(".node circle")
        .classed("to-find", (d) => d.toFind || false)
        .classed("selected", (d) => d.isSelected || false)
        .classed("to-check", (d) => d.toBeChecked || false)
        .classed("done", (d) => d.done || false);
  }


  /* updateTrackingText: Change searching text to show status */

  function updateTrackingText(nodesToVisit, current){

    d3.select("#list").text(nodesToVisit.join(", "));
    d3.select("#current-check").text(current);
  }


  /* pulseFoundCircle: Animation when node is found */

  function pulseFoundCircle(circle) {

    circle.transition()
      .duration(500)
      .attr("class", "found")
      .attr("r", 50)
      .transition()
      .duration(500)
      .attr("r", 10);
  }


/* resetCirclesDisplay: Clear node attributes and return graph to original state. */

  function resetCirclesDisplay() {

    d3.select("#graph").html("");
    buildTree(TREE_DATA);
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
    // d3.select(".found").classed("found", false);
  }

///////////////////////////////////////////////////////////////////////////////
// Searching
  /* initSearch: Set up breadth first search. Start at root node. */

  function initSearch(evt) {

    var searchText = d3.select("input").property("value");
    resetCirclesDisplay();

    d3.select(this).style("font-weight", "bold");
    d3.select("#" + searchText + " circle").classed("to-find", true).datum().toFind = true;

    // Start at the first node
    var current = d3.select("#Dumbledore");
    current.datum().isSelected = true;
    updateCircles();

    updateTrackingText(["Dumbledore"], "Dumbledore");

      setTimeout(() => treeSearch(current, searchText, [], this.value), 1000);
  }


  /*
   * treeSearch: Search for the matching node for the toFind value. Recursive function adds
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
    }, TEXTDELAY);

    // Change current node status to done. Update display.
    currentNode.isSelected = false;
    currentNode.done = true;
    setTimeout(updateCircles, CIRCLEDELAY);

    setTimeout(() => treeSearch(current, toFind, checkList, type), NEXTNODEDELAY);
  }


  

  // Event listeners
  d3.selectAll(".start-search-button").on("click", initSearch);
  d3.select("#reset").on("click", resetCirclesDisplay);

  buildTree(TREE_DATA);

}());
