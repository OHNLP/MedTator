/**
 * Sankey Diagram based on D3-sankey
 */
var fig_sankey = {
    // settings for the sankey figure
    width: 650,
    height: 550,
    margin: {
        top: 20, 
        right: 10, 
        bottom: 10, 
        left: 10
    },

    node_width: 15,
    lane_width: 150,
    n_lanes: 3,
    padding: 6,

    // variables for quick access
    svg: null,

    // for all elements in sankey
    chart: null,

    // the sankey function by d3-sankey
    sankey: null,

    // graph created by sankey function
    graph: null,

    // links element in the graph
    links: null,

    // nodes element in the grpah
    nodes: null,

    // DOM, please modify when init
    fig_id: '#fig_sankey',

    // Headers for each lane of node
    headers: [
        'A', 'B', 'C', 'D'
    ],

    init: function(fig_id) {
        if (typeof(fig_id) != 'undefined') {
            // update the local fig_id
            this.fig_id = fig_id;
        }

        // get the svg
        this.svg = d3.select("#sankey-diagram")
            .append("svg")
            .attr('id', 'sankey-diagram-svg')
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        // get the chart
        this.chart = svg.append("g")
            .attr("transform", 
                "translate(" + margin.left + "," + margin.top + ")"
            );

        // create the sankey
        this.sankey = d3.sankey()
            .size([
                this.node_width + 
                    this.n_lanes * (this.lane_width + this.node_width),
                this.height
            ])
            .nodeId(d => d.name)
            .nodeWidth(this.node_width)
            .nodePadding(this.padding)
            .nodeSort(this.node_sort)
            .linkSort(this.link_sort)
            .nodeAlign(d3.sankeyCenter);
    },

    node_sort: function(a, b) {
        return -1;
    },

    link_sort: function(a, b) {
        return b.value - a.value;
    },

    draw: function(data) {
        this.graph = this.sankey(data);

        // draw nodes
        this._draw_nodes();
        
        // draw links
        this._draw_links();

        // draw headers
        this._draw_headers();
    },

    _draw_links: function() {
        // draw links
        this.links = this.chart.append("g")
            .classed("links", true)
            .selectAll("path")
            .data(this.graph.links)
            .enter()
            .append("path")
            .classed("link", true)
            .attr("d", d3.sankeyLinkHorizontal())
            .attr("fill", "none")
            .attr("stroke", function(d) {
                // if (d.layer == 2) {
                //     return d.target.color;
                // } else {
                //     return d.source.color;
                // }
                return '#888888';
            })
            .attr("stroke-width", d => d.width)
            .attr("stroke-opacity", .2);
    },

    _draw_nodes: function() {
        this.nodes = this.chart.append("g")
            .classed("nodes", true)
            .selectAll("rect")
            .data(this.graph.nodes)
            .enter();

        // add the rect of each node
        this.nodes.append("rect")
            .classed("node", true)
            .attr("x", d => d.x0)
            .attr("y", d => d.y0)
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => get_color(d.name))
            .attr("opacity", 0.8);

        // add text
        nodes.append("g")
            .attr('class', 'node-label')
            .attr('transform', function(d) {
                var offset = 0;
                var dx = d.x0 + sankey.nodeWidth() + 5 + offset;
                var dy = d.y0 + (d.y1 - d.y0) / 2;
                return `translate(${dx}, ${dy})`;
            })
            .each(function(d) {
                var node = d3.select(this);
                node.append('text')
                    .attr('class', 'nodel-name')
                    .attr("text-anchor", "start")
                    .attr("transform", null)
                    .attr('font-size', 10)
                    .attr('y', -1)
                    .text(d.name);
                node.append('text')
                    .attr('class', 'nodel-value')
                    .attr("text-anchor", "start")
                    .attr("transform", null)
                    .attr('font-size', 8)
                    .attr('y', 6)
                    .text("N=" + d.value);
            })
    },

    _draw_headers: function() {
        // add the header
        this.svg.selectAll('text.header')
            .data(this.headers)
            .enter()
            .append('text')
            .attr('x', function(d, i) {
                return (this.node_width + this.lane_width) * i + this.margin.left;
            })
            .attr('y', 15)
            .attr('font-size', 10)
            .attr("font-family", "Helvetica")
            .attr('font-weight', 'bold')
            .text(function(d) {
                return d;
            });
    }
};