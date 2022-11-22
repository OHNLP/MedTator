var fig_bratvis = {
    plot_id: 'fig_bratvis',
    bratLocation: './static/lib/brat',

    init: function () {

        head.js(
            // External libraries
            this.bratLocation + '/lib/jquery.svg.min.js',
            this.bratLocation + '/lib/jquery.svgdom.min.js',

            // brat helper modules
            this.bratLocation + '/src/configuration.js',
            this.bratLocation + '/src/util.js',
            this.bratLocation + '/src/annotation_log.js',
            this.bratLocation + '/lib/webfont.js',

            // brat modules
            this.bratLocation + '/src/dispatcher.js',
            this.bratLocation + '/src/url_monitor.js',
            this.bratLocation + '/src/visualizer.js'
        );

        head.ready(function () {
            // bind to local variable
            fig_bratvis.Util = Util;
        });
    },

    make_col_data: function() {
        
    },

    draw: function (data, doc_date) {
        // update data
        this.data = data;
        this.doc_data = doc_date;

        // $('#' + this.plot_id).html('');
        // create a new div
        var new_div_id = this.plot_id + '_' + (Math.random() * 100000).toFixed(0);

        $('#' + this.plot_id).html(`
        <div id="${new_div_id}" class="brat-vis" style="width:100%;">
        </div>
        `);

        // update the collData according to data
        for (var i = 0; i < data.attributes.length; i++) {
            var attr = data.attributes[i];
            var t = attr[1]; // attr type
            var v = attr[3];
            if (t == 'norm') {
                if (collData.entity_attribute_types[0].values.hasOwnProperty(v)) {
                    
                } else {
                    collData.entity_attribute_types[0].values[v] = {
                        glyph: "[" + v + "]"
                    };
                }
            } else if (t == 'val') {
                var dt = this.timex2date(v, doc_date);
                var dt_str = dt.format('YYYY-MM-DD');
                if (collData.entity_attribute_types[1].values.hasOwnProperty(dt_str)) {
                    
                } else {
                    collData.entity_attribute_types[1].values[v] = {
                        glyph: "[" + dt_str + "]"
                    };
                }
            }
        }

        this.Util.embed(
            new_div_id,
            $.extend({}, collData),
            $.extend({}, data),
            webFontURLs
        )
    }
};