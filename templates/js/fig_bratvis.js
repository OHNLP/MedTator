var fig_bratvis = {
    plot_id: 'fig_bratvis',

    // as we revised the brat code,
    // we need to use local version.
    brat_location: './static/lib/brat',

    // the brat_util obj
    util: null,

    init: function () {
        if (this.util != null) {
            return;
        }

        // init if util is null
        head.js(
            // External libraries
            this.brat_location + '/lib/jquery.svg.min.js',
            this.brat_location + '/lib/jquery.svgdom.min.js',

            // brat helper modules
            this.brat_location + '/src/util.js',
            this.brat_location + '/src/configuration.js',
            this.brat_location + '/src/annotation_log.js',
            this.brat_location + '/lib/webfont.js',

            // brat modules
            this.brat_location + '/src/dispatcher.js',
            this.brat_location + '/src/url_monitor.js',
            this.brat_location + '/src/visualizer.js'
        );

        head.ready(function () {
            // bind to local variable
            fig_bratvis.util = BratUtil;
        });
    },

    /**
     * Visualize the annotation data in a SVG image
     * 
     * @param {object} col_data collection data for brat
     * @param {object} doc_date document data for brat
     * @param {string} plot_id optional DOM ID for the plot
     * @returns None
     */
    visualize: function (col_data, doc_date, plot_id) {
        if (this.util == null) {
            return;
        }

        if (typeof(plot_id) == 'undefined') {
            plot_id = this.plot_id
        }

        // update data
        this.col_data = col_data;
        this.doc_date = doc_date;

        // clear the old one
        $('#' + plot_id).html('');

        // create a new div id
        var new_div_id = plot_id + '_' + (Math.random() * 100000).toFixed(0);
        $('#' + plot_id).html(
            `<div id="${new_div_id}" class="brat-vis" style="width:100%;"></div>`
        );

        // use brat to render
        this.util.embed(
            new_div_id,
            $.extend({}, col_data),
            $.extend({}, doc_date),
            [
                this.brat_location + '/css/fonts/Astloch-Bold.ttf',
                this.brat_location + '/css/fonts/PT_Sans-Caption-Web-Regular.ttf',
                this.brat_location + '/css/fonts/Liberation_Sans-Regular.ttf'
            ]
        )
    },

    /**
     * Clear the brat visualization
     * 
     * @param {string} plot_id optional DOM ID for the plot
     */
    clear: function(plot_id) {

        if (typeof(plot_id) == 'undefined') {
            plot_id = this.plot_id
        }

        // clear the old one
        $('#' + plot_id).html('');
    }
};