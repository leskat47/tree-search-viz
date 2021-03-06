/* Class to build nodes for tree */

class P {
  constructor(name, children) {
    name: name;
    children: children
  }
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

class Tree {
  constructor (name, data, width, height) {
    this.name = name;
    this.SVG_WIDTH = width;
    this.SVG_HEIGHT = height;
    this.CIRCLE_RADIUS = width/60;
    this.treeData = data;
  }

  buildTree() {

    // set the dimensions and margins of the diagram
    const treeMargin = {top: 40, right: 90, bottom: 50, left: 90};
    const treeWidth = this.SVG_WIDTH - treeMargin.left - treeMargin.right;
    const treeHeight = this.SVG_HEIGHT - treeMargin.top - treeMargin.bottom;

    // append the svg obgect to the body of the page
    const svg = d3.select("#graph").append("svg")
          .attr("width", this.SVG_WIDTH)
          .attr("height", this.SVG_HEIGHT);

    // append a 'group' element to 'svg' adjust location to be within tree area
    const g = svg.append("g")
          .attr("transform",
                "translate(" + treeMargin.left + "," + treeMargin.top + ")");

    // declare a tree layout and assigns the size
    const treemap = d3.tree()
        .size([treeWidth, treeHeight]);

    //  assign the data to a hierarchy using parent-child relationships
    // map the node data to the tree layout
    const nodes = treemap(d3.hierarchy(this.treeData));


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
      .attr("r", this.CIRCLE_RADIUS);


    // add the text to the node
    // place label above circle unless it's the bottom/last node
    node.append("text")
      .attr("dy", ".35em")
      .attr("y", (d) => d.children ? -20 : 20)
      .text(d => d.data.name);

    return g;
  }

  // Show Text display for search
  createUI() {
    d3.select('body').append('div')
      .html('Search for: <input type="text" id="search-term"><button type="button" class="start-search-button" value="breadth">Breadth First Search</button><button type="button" class="start-search-button" value="depth">Depth First Search</button><button type="button" id="reset">Reset</button>');
    d3.select('body').append('div')
      .attr('id', 'graph');
    d3.select('body')
      .append('div')
      .append('h3').
      text('Nodes to Check');
    d3.select('body')
      .append('div')
      .attr('id', 'list')
    d3.select('body')
      .append('h3')
      .text('Currently Checking');
    d3.select('body')
      .append('div')
      .attr('id', 'current-check');
  }
}

var tree = new Tree("Hogwarts", TREE_DATA, 660, 500);
tree.createUI();
tree.buildTree();
