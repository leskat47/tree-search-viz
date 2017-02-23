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

  const REF_LIST = ["Dumbledore", "Flitwick",
    "Padma","McGonagall", "Ron", "Seamus", "Neville", "Hermoine", "Pavarti", "Lavendar", 
    "Snape", "Malfoy", "Crabbe", "Goyle"]
  var CIRCLEDELAY = 800;
  var TEXTDELAY;
  var NEXTNODEDELAY;
  var nextNode;

  function updateDelays(circleDelay) {
    TEXTDELAY = circleDelay;
    NEXTNODEDELAY = 3 * circleDelay;
  }

  const CIRCLE_RADIUS = 10;
  const SVG_HEIGHT = 500;
  const SVG_WIDTH = 660;


  ///////////////////////////////////////////////////////////////////////////////
  // Setup Tree

  /* buildTree: Create d3 tree and append data */

  function buildTree(treeData) {
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
    d3.selectAll(".start-search-button").classed("active", false);
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

  function initSearch(startNode, searchText, searchType) {
    if (REF_LIST.indexOf((document.getElementById("search-term").value)) >=0 ) {
      d3.select("#" + searchText + " circle").classed("to-find", true).datum().toFind = true;
    }
    CIRCLEDELAY = document.getElementById("speed").value;
    updateDelays(CIRCLEDELAY);
    // Start at the first node. Set up tracking list.
    var current = d3.select("#" + startNode);
    updateTrackingText([startNode], startNode);

    setTimeout(() => treeSearch(current, searchText, [startNode], searchType), 500);
  }
  /*
   * treeSearch: Search for the matching node for the toFind value. Recursive function adds
   * child nodes to the end of the queue until the first item in the queue has
   * the same name value as toFind.
  */

  function treeSearch(currentNode, nameToFind, checkList, type) {
    var currentNodeData = currentNode.datum()

    currentNodeData.toBeChecked = false;
    currentNodeData.isSelected = true;

    var children = currentNode.datum().children || [];

    // set children of current node to toBeChecked and add to queue
    children.forEach(function(element) {
      d3.select("#" + element.data.name).datum().toBeChecked = true;
      checkList.push(element.data.name);
    });

    // Update display with current active node and children
    updateCircles();

    // Base case: Node found. Pulse current node and return
    if (currentNodeData.data.name === nameToFind) {
      pulseFoundCircle(currentNode.select("circle"));
      handleSearchDone();
      return;
    }

    // Take next items to be checked based on type of search
    // Dequeue from check list for breadth, pop for depth
    if (type === "breadth") {
      updateTrackingText(checkList, checkList[0]);
      checkList.shift();
      currentNode = d3.select("#" + checkList[0]);

    } else if (type === "depth") {
      if (checkList[0] === "Dumbledore") { 
        checkList.shift();
      } else {
        updateTrackingText(checkList, checkList[checkList.length - 1]);
        currentNode = d3.select("#" + checkList.pop());
      }
    }

    // Change current node status to done. Update display.
    currentNodeData.isSelected = false;
    currentNodeData.done = true;
    setTimeout(updateCircles, CIRCLEDELAY);

    setTimeout(() => treeSearch(currentNode, nameToFind, checkList, type), NEXTNODEDELAY);
  }


//  /////////////////////////////////////////////////////////////////////////////
// UI


  /* handleStartSearch: UI for starting search, get values show search in view */
  function handleStartSearch(evt){
    resetCirclesDisplay();
    var searchText = d3.select("input").property("value");
    if (searchText) {
      var searchType = this.value;
      d3.select(this).classed("active", true);
      initSearch(TREE_DATA.name, searchText, searchType);
    }
    else {
      alert("please select a node")
    }
  }


  /* handleSearchDone: post-search UI cleanup */

  function handleSearchDone() {
    d3.select(".start-search-button").classed("active", false);
  }

///////////////////////////////////////////////////////////////////////////////
// Event Listeners

  d3.selectAll(".start-search-button").on("click", handleStartSearch);
  d3.select("#reset").on("click", resetCirclesDisplay);
  // d3.select(document).on("search-done", handleSearchDone);

  buildTree(TREE_DATA);

}());
