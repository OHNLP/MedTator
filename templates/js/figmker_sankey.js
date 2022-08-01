/**
 * Sankey Diagram based on D3-sankey
 */
var figmker_sankey = {


make_fig: function(box_id) {

return {
    // settings for the sankey figure
    width: 620,
    height: 500,
    margin: {
        top: 15, 
        right: 10, 
        bottom: 10, 
        left: 10
    },

    node_width: 15,
    lane_width: 150,
    n_lanes: 3,
    padding: 8,

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
    box_id: box_id,

    // Headers for each lane of node
    headers: [
        'A', 'B', 'C', 'D'
    ],

    // callbacks
    on_click_node: function(d) {
        console.log('* clicked node', d);
    },
    on_click_link: function(d) {
        console.log('* clicked link', d);
    },

    init: function() {
        // get the svg
        this.svg = d3.select(this.box_id)
            .append("svg")
            .attr('id', this.box_id+'_svg')
            .attr("width", this.width + this.margin.left + this.margin.right)
            .attr("height", this.height + this.margin.top + this.margin.bottom);

        // create the sankey
        this.sankey = d3.sankey()
            .size([
                this.node_width + 
                    this.n_lanes * (this.lane_width + this.node_width),
                this.height
            ])
            .nodeId(d => d.id)
            .nodeWidth(this.node_width)
            .nodePadding(this.padding)
            .nodeSort(this.node_sort)
            .linkSort(this.link_sort)
            .nodeAlign(d3.sankeyCenter);
    },

    node_sort: function(a, b) {
        return b.value - a.value;
    },

    link_sort: function(a, b) {
        return b.value - a.value;
    },

    clear: function() {
        this.chart.remove();
        this.chart = null;
    },

    draw: function(data) {
        this.graph = this.sankey(data);

        if (this.chart != null) {
            // this is not a new chart
            this.clear();
        }

        // draw a blank chart for 
        this._draw_blank_chart();
        
        // draw links
        this._draw_links();

        // draw nodes
        this._draw_nodes();

        // draw headers
        this._draw_headers();
    },

    _draw_blank_chart: function() {
        // get the chart
        this.chart = this.svg.append("g")
            .attr('id', this.box_id + '_chart')
            .attr("class", "sankey-chart")
            .attr("transform", 
                "translate(" + this.margin.left + "," + this.margin.top + ")"
            );
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
            .attr("class", d=>{
                if (d.hasOwnProperty('class_name')) {
                    return 'sankey-link ' + d.class_name;
                } else {
                    return 'sankey-link'
                }
            })
            .attr("fill", "none")
            .attr("stroke", function(d) {
                // if (d.layer == 2) {
                //     return d.target.color;
                // } else {
                //     return d.source.color;
                // }
                return '#cccccc';
            })
            .attr("stroke-width", d => d.width)
            .attr("stroke-opacity", .5)
            .on('click', this.on_click_link);
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
            .attr("class", d=>{
                if (d.hasOwnProperty('class_name')) {
                    return 'sankey-node ' + d.class_name;
                } else {
                    return 'sankey-node';
                }
            })
            .attr("fill", '#999999')
            .attr("opacity", 1)
            .on('click', this.on_click_node);

        // add text
        this.nodes.append("g")
            .attr('class', 'node-label')
            .attr('transform', function(d) {
                var offset = 0;
                var dx = d.x0 + 20 + offset;
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
                    .attr('y', 8)
                    .text("" + d.value);
            });
    },

    _draw_headers: function() {
        // add the header
        this.chart.selectAll('text.header')
            .data(this.headers)
            .enter()
            .append('text')
            .attr('x', (function(fig) {
                return function(d, i) {
                    return (fig.node_width + fig.lane_width) * i;
                }
            })(this))
            .attr('y', -5)
            .attr('font-size', 10)
            .attr("font-family", "Helvetica")
            .attr('font-weight', 'bold')
            .text(function(d) {
                return d;
            });
    }
}

} // end of make_fig

};