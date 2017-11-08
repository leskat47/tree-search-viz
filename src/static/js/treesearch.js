  // Global data

  /* Function to build nodes for tree */

  class P {
    constructor(name, children) {
      this.name = name;
      this.children = children;
    };
  }

  const TREE_DATA =
    new P("Dumbledore", [
      new P("Flitwick", [
        new P("Padma"),
      ]),
      new P("McGonagall", [
        new P("Ron", [
          new P("Seamus"),
          new P("Neville"),
        ]),
        new P("Hermoine", [
          new P("Pavarti"),
          new P("Lavendar"),
        ]),
      ]),
      new P("Snape", [
        new P("Malfoy", [
          new P("Crabbe"),
          new P("Goyle"),
        ])
      ])
    ]);

  let CIRCLEDELAY = 800;
  let TEXTDELAY;
  let NEXTNODEDELAY;
  let nextNode;

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

  class Tree {
    constructor(treeData) {
      // set the dimensions and margins of the diagram
      this.treeMargin = {top: 40, right: 90, bottom: 50, left: 90};
      this.treeWidth = SVG_WIDTH - this.treeMargin.left - this.treeMargin.right;
      this.treeHeight = SVG_HEIGHT - this.treeMargin.top - this.treeMargin.bottom;
      this.treeData = treeData;
      this.setTree(treeData);
    }

    setTree(){
      // append the svg obgect to the body of the page
      let svg = d3.select("#graph").append("svg")
            .attr("width", SVG_WIDTH)
            .attr("height", SVG_HEIGHT);

      // append a 'group' element to 'svg' adjust location to be within tree area
      let g = svg.append("g")
            .attr("transform",
                  "translate(" + this.treeMargin.left + "," + this.treeMargin.top + ")");

      // declare a tree layout and assigns the size
      let treemap = d3.tree()
          .size([this.treeWidth, this.treeHeight]);

      //  assign the data to a hierarchy using parent-child relationships
      // map the node data to the tree layout
      let nodes = treemap(d3.hierarchy(this.treeData));


      // add links between the nodes
      let link = g.selectAll(".link")
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
      let node = g.selectAll("circle .node")
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

    updateCircles() {

      d3.selectAll(".node circle")
          .classed("to-find", (d) => d.toFind || false)
          .classed("selected", (d) => d.isSelected || false)
          .classed("to-check", (d) => d.toBeChecked || false)
          .classed("done", (d) => d.done || false);
    }


    /* updateTrackingText: Change searching text to show status */
    updateTrackingText(nodesToVisit, current){
      d3.select("#list").text(nodesToVisit.join(", "));
      d3.select("#current-check").text(current);
    }

    /* pulseFoundCircle: Animation when node is found */
    pulseFoundCircle(circle) {
      circle.transition()
        .duration(500)
        .attr("class", "found")
        .attr("r", 50)
        .transition()
        .duration(500)
        .attr("r", 10);
    }

  /* resetCirclesDisplay: Clear node attributes and return graph to original state. */
    resetCirclesDisplay() {
      d3.selectAll(".start-search-button").classed("active", false);
      d3.select("#graph").html("");
      this.setTree();
      // document.getElementsByTagName('input')[0].value = "";
      // let nodes = d3.selectAll(".node");
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

    handleSearchStart(startNode, searchText, searchType) {
      // if (REF_LIST.indexOf((document.querySelector("search-term").value)) >=0 ) {
      //   d3.select("#" + searchText + " circle").classed("to-find", true).datum().toFind = true;
      // }
      this.resetCirclesDisplay();
      CIRCLEDELAY = document.querySelector("#speed").value;
      updateDelays(CIRCLEDELAY);
      // Start at the first node. Set up tracking list.
      let current = d3.select("#" + startNode);
      this.updateTrackingText([startNode], startNode);

      setTimeout(() => this.treeSearch(current, searchText, [], searchType), 500);
    }
    /*
     * treeSearch: Search for the matching node for the toFind value. Recursive function adds
     * child nodes to the end of the queue until the first item in the queue has
     * the same name value as toFind.
    */

    treeSearch(currentNode, nameToFind, checkList, type) {
      let currentNodeData = currentNode.datum();

      currentNodeData.toBeChecked = false;
      currentNodeData.isSelected = true;

      // set children of current node to toBeChecked and add to queue/stack
      let children = currentNode.datum().children || [];

      children.forEach(function(element) {
        d3.select("#" + element.data.name).datum().toBeChecked = true;
        checkList.push(element.data.name);
      });
      // Update display with current active node and children
      this.updateCircles();
      this.updateTrackingText(checkList, currentNodeData.data.name);

      // Base case: Node found. Pulse current node and return
      if (currentNodeData.data.name === nameToFind) {
        this.pulseFoundCircle(currentNode.select("circle"));
        this.handleSearchDone();
        return;
      }

      // Take next items to be checked based on type of search
      // Dequeue from check list for breadth, pop for depth
      if (type === "breadth") {
        currentNode = d3.select("#" + checkList.shift());
      } else if (type === "depth") {
        currentNode = d3.select("#" + checkList.pop());
      }

      // Change current node status to done. Update display.
      currentNodeData.isSelected = false;
      currentNodeData.done = true;
      setTimeout(this.updateCircles, CIRCLEDELAY);

      setTimeout(() => this.treeSearch(currentNode, nameToFind, checkList, type), NEXTNODEDELAY);
    }


//  /////////////////////////////////////////////////////////////////////////////
// UI

  /* handleSearchDone: post-search UI cleanup */

  handleSearchDone() {
    d3.select(".start-search-button").classed("active", false);
  }
}
///////////////////////////////////////////////////////////////////////////////
// Event Listeners
  let tree = new Tree(TREE_DATA);
  d3.selectAll(".start-search-button").on("click", function(evt) {
    let searchText = d3.select("input").property("value");
    // debugger;
    if (searchText) {
      let searchType = this.value;
      d3.select(this).classed("active", true);
      tree.handleSearchStart(TREE_DATA.name, searchText, searchType);
    }
    else {
      alert("please select a node")
    }
  });
  d3.select("#reset").on("click", () => tree.resetCirclesDisplay());
  // d3.select(document).on("search-done", handleSearchDone);
