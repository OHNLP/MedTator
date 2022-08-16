/**
 * This is an extension for the error analysis in app_hotpot
 */

/////////////////////////////////////////////////////////////////
// Error Analysis related variables
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_data, {

    // loading files 
    // null: not loading
    // any number: loading
    razer_loading_status: null,

    // input data 1 and 2
    // for holding the uploaded anns
    razer_ann_list: [
        // the first one must be the GSC
        { anns: [], name: 'Gold Standard Corpus' },
        // others follow the same structure
        { anns: [], name: 'Dataset 1' }
    ],

    // input data 3 (optional)
    // the err def for analysis
    razer_err_def: null,
    razer_err_def_dict: {
        shortcut: {},
        adv_def: {}
    },

    // input data 3 (optional)
    // the err labels
    razer_err_labels_file: null,

    // for all razer information
    // the structure looks like:
    // {
    //     // this is the result of dataset 1
    //     // it's a err_dict
    //     1: {
    //         err_stat: {},
    //         err_dict: { uid: {} },
    //         iaa_dict: { }, // same iaa_dict
    //     },
    //     2: {}
    // },
    // 
    // we don't want to save extra information here
    razer_dict: null,

    // by default, just use the first dataset
    // the rid is this razer id or resource id
    razer_idx: 1,

    // show panel for add label
    is_shown_razer_pan_err_def: false,
    razer_active_err_uid: null,
    razer_pan_err_def_right: 0,
    razer_pan_err_def_top: 0,

    // flag for showing tsne
    razer_flag_has_embedding_tsne: false,

    // flag for showing the details in tag list
    razer_flag_show_taglist_context: true,

    // flag for showing the labels in tag list
    razer_flag_show_taglist_labels: true,

    // the fig obj for sankey
    razer_fig_sankey: null,

    // the fig obj for pie
    razer_fig_donut: null,

    // the fig obj for doc distribution
    razer_fig_doc_scatter: null,

    // the fig obj for doc heatmap
    razer_fig_doc_heatmap: null,

    // the fig obj for tag scatter
    razer_fig_tag_scatter: null,
    razer_fig_tag_scatter_clr: 'by_err',

    // the uids for checking
    razer_err_list_uids: null,

    // the EA service url
    razer_ea_ws_url: 'http://localhost:8808/eva_tags',

    // the TE service url
    razer_te_ws_url: 'http://localhost:8809/embedding'
});


/////////////////////////////////////////////////////////////////
// Error Analysis related functions
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_computed, {
    razer_err_def_info: function() {
        return error_analyzer.get_stat_of_err_def(
            this.razer_err_def
        );
    },

    razer_err_tag_top_10: function() {
        return error_analyzer.get_top_10_tokens(
            this.razer_dict[this.razer_idx].err_stat.by_txt
        );
    }
});

Object.assign(app_hotpot.vpp_methods, {

    set_meta_of_error_definition: function(err_def) {
        this.razer_err_def = err_def;
    },

    get_razer_rst: function() {
        if (this.razer_dict == null) {
            return null;
        } else {
            return this.razer_dict[this.razer_idx];
        }
    },

    get_razer_err: function(uid) {
        var rr = this.get_razer_rst();
        if (rr == null) {
            return null;
        }
        if (rr.err_dict.hasOwnProperty(uid)) {
            return rr.err_dict[uid];
        }
        return null;
    },

    get_razer_n_stat_by_err_type: function(err_type, err) {
        var stat = this.get_razer_stat_by_err_type(err_type, err);

        if (stat == null) {
            return null;
        } else {
            return stat.length;
        }
    },

    get_razer_stat_by_err_type: function(err_type, err) {
        var rr = this.get_razer_rst();
        if (rr == null) {
            return null;
        }
        if (!rr.err_stat.by_err.hasOwnProperty(err_type)) {
            return null;
        }

        // err is FP or FN
        if (typeof(err)=='undefined') {
            return rr.err_stat.by_err[err_type].FP.concat(
                rr.err_stat.by_err[err_type].FN
            );
        }
        return rr.err_stat.by_err[err_type][err];
    },

    clear_razer_all: function() {
        // clear input
        this.razer_ann_list = [
            // the first one must be the GSC
            { anns: [], name: 'Gold Standard Corpus' },
            // others follow the same structure
            { anns: [], name: 'Dataset 1' }
        ];
        this.razer_err_labels_file = null;

        // clear data
        this.razer_idx = 1;
        this.razer_dict = null;
        this.razer_err_def = null;
        if (this.razer_fig_sankey != null) {
            this.razer_fig_sankey.clear();
            this.razer_fig_sankey = null;
        }
    },

    on_drop_dropzone_razer: function(event, rid) {
        // stop the download event
        event.preventDefault();
        const items = event.dataTransfer.items;

        // set loading status
        this.razer_loading_status = rid;

        // set loading rid
        var promise_files = fs_get_file_texts_by_items(
            items,
            // only accept xml for iaa
            function(fn) {
                if (app_hotpot.is_file_ext_xml(fn)) {
                    return true;
                }
                return false;
            }
        );
        promise_files.then(function(files) {
            app_hotpot.vpp.add_files_to_razer_anns(files, rid);
        });
    },

    add_files_to_razer_anns: function(files, rid) {
        console.log('* adding '+files.length+' files to razer anns ' + rid);
        // it's possible that the `rid` slot is not ready
        if (this.razer_ann_list.length <= rid) {
            this.razer_ann_list.push({
                anns: [],
                name: 'Dataset ' + rid
            });
        }
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            var ann = app_hotpot.parse_file2ann(
                file,
                this.dtd
            );

            // it is possible that something wrong
            if (ann == null) {
                continue;
            }

            // save this ann
            this.razer_ann_list[rid].anns[
                this.razer_ann_list[rid].anns.length
            ] = ann;
        }

        // done and set loading finished
        this.razer_loading_status = null;
    },


    on_drop_dropzone_razer_err_labels: function(event) {
        // stop the download event
        event.preventDefault();
        const items = event.dataTransfer.items;
        
        // set loading status
        this.razer_loading_status = Math.random();

        // set loading rid
        var promise_files = fs_get_file_texts_by_items(
            items,
            // only accept xml for iaa
            function(fn) {
                if (app_hotpot.is_file_ext_json(fn)) {
                    return true;
                }
                return false;
            }
        );
        promise_files.then(function(files) {
            // for error labels, just use one file?
            app_hotpot.vpp.set_file_to_razer_err_labels(files[0]);
        });
    },

    set_file_to_razer_err_labels: function(file) {
        var obj = JSON.parse(file.text);

        this.razer_err_labels_file = {
            _fh: file.fh,
            tags: obj.tags
        };

        // done and set loading finished
        this.razer_loading_status = null;
    },

    on_click_razer_load_err_labels: function() {

    },

    parse_razer_files: function() {
        var is_reparse = false;
        if (this.razer_dict != null) {
            // which means there is something analyzed
            var ret = app_hotpot.confirm(
                'Re-Analyze will overwrite ALL of the existing error labels. You can save the current first before doing this. Are you sure to continue?'
            );

            if (ret) {
                // OK, just re-parse everything
                is_reparse = true;
            } else {
                return;
            }
        }

        // first, get the IAA result 
        var iaa_dict = iaa_calculator.evaluate_anns_on_dtd(
            this.dtd,
            // using 1 as dataset for eva
            this.razer_ann_list[1].anns,
            // using 0 as GSC
            this.razer_ann_list[0].anns,
            'overlap',
            iaa_calculator.default_overlap_ratio,
            null,
            true
        );

        // second, get the err_dict and doc_dict
        var err_doc = iaa_calculator.get_iaa_error_tags(
            iaa_dict,
            this.dtd
        );

        // then, check if the error definition
        if (this.razer_err_def == null) {
            this.razer_err_def = JSON.parse(JSON.stringify(
                error_analyzer.DEFAULT_ERROR_DEF
            ));
        }

        // add UNKNOWN for err_def
        this.razer_err_def[error_analyzer.UNK_ERROR_CATE] = [error_analyzer.UNK_ERROR_TYPE];

        // add mapping for shortcut keys
        var shortcut = 1;
        for (const err_cate in this.razer_err_def) {
            this.razer_err_def_dict.shortcut[shortcut] = err_cate;
            shortcut += 1;
        }

        // add color mapping
        var err_cate_clr_idx = 0;
        for (const err_cate in this.razer_err_def) {
            if (err_cate == 'UNK') {
                this.razer_err_def_dict.adv_def[err_cate] = {
                    level: 'category',
                    category: null,
                    types: ['UNKNOWN'],
                    color: '#999999'
                }
            } else {
                this.razer_err_def_dict.adv_def[err_cate] = {
                    level: 'category',
                    category: null,
                    types: this.razer_err_def[err_cate],
                    color: error_analyzer.ERROR_COLOR_SCHEMA[err_cate_clr_idx].c_cate
                };
            }
            // add color for each type
            for (let i = 0; i < this.razer_err_def[err_cate].length; i++) {
                var err_type = this.razer_err_def[err_cate][i];
                if (err_type == 'UNKNOWN') {
                    this.razer_err_def_dict.adv_def[err_type] = {
                        level: 'type',
                        category: 'UNK',
                        types: null,
                        color: '#999999'
                    }
                } else {
                    this.razer_err_def_dict.adv_def[err_type] = {
                        level: 'type',
                        category: err_cate,
                        types: null,
                        color: error_analyzer.ERROR_COLOR_SCHEMA[err_cate_clr_idx].c_type[i]
                    };
                }
            }
            err_cate_clr_idx += 1;
        }

        // then, check if there is tags
        // a flag for indicating if there is embedding for tsne?
        var razer_flag_has_embedding_tsne = false;
        if (this.razer_err_labels_file != null) {
            // ok, let's use the given labels to update err
            for (let i = 0; i < this.razer_err_labels_file.tags.length; i++) {
                const t = this.razer_err_labels_file.tags[i];
                if (t.hasOwnProperty('errors')) {
                    // oh, this tag doesn't have error labels,
                    // just skip it
                    // now let's check if there is a same uid tag
                    if (err_doc.err_dict.hasOwnProperty(t.uid)) {
                        // great! let's update this uid
                        err_doc.err_dict[t.uid]['errors'] = t.errors;
                    }
                }

                // add embedding if any
                if (t.hasOwnProperty('embedding_tsne')) {
                    razer_flag_has_embedding_tsne = true;
                    if (err_doc.err_dict.hasOwnProperty(t.uid)) {
                        // great! let's update this uid
                        err_doc.err_dict[t.uid]['embedding_tsne'] = t.embedding_tsne;
                    }
                }
            }
        }

        // then, get the stat
        var err_stat = error_analyzer.get_err_stat(
            iaa_dict,
            err_doc.err_dict,
            this.dtd
        );

        // last, set to razer_dict
        if (this.razer_dict == null) {
            this.razer_dict = {};
        }

        // update the razer_dict for data
        this.razer_dict[
            this.razer_idx
        ] = {
            iaa_dict: iaa_dict,
            err_dict: err_doc.err_dict,
            doc_dict: err_doc.doc_dict,
            err_stat: err_stat
        };

        // update flag
        this.razer_flag_has_embedding_tsne = razer_flag_has_embedding_tsne;

        // draw?
        this.update_plots();

        // force update if re-parse
        if (is_reparse) {
            this.$forceUpdate();
        }
    },

    update_razer_dict_stats: function() {
        // then, get the stat
        var err_stat = error_analyzer.get_err_stat(
            this.razer_dict[this.razer_idx].iaa_dict,
            this.razer_dict[this.razer_idx].err_dict,
            this.dtd
        );

        // just update stats
        this.razer_dict[
            this.razer_idx
        ].err_stat = err_stat;

        // draw?
        this.update_plots();
    },

    update_plots: function() {
        // this.draw_razer_fig_donut();
        this.draw_razer_fig_sankey();
        // this.draw_razer_fig_doc_scatter();
        this.draw_razer_fig_doc_heatmap();
        this.draw_razer_fig_tag_scatter();
    },

    /////////////////////////////////////////////////////////////////
    // Sankey related functions
    /////////////////////////////////////////////////////////////////
    draw_razer_fig_sankey: function() {
        var data_sankey = error_analyzer.get_sankey_data(
            this.get_razer_rst().err_stat.by_rel,
            this.razer_err_def_dict
        );
        console.log('* got data for sankey diagram', data_sankey);

        if (this.razer_fig_sankey == null) {
            // make a new sankey figure
            this.razer_fig_sankey = figmker_sankey.make_fig(
                '#razer_sankey_diagram'
            );
            this.razer_fig_sankey.headers = [
                'Error',
                'Error Category',
                'Error Type',
                'Concept'
            ]
            this.razer_fig_sankey.init();

            // bind click events
            this.razer_fig_sankey.on_click_node = this.on_click_razer_sankey_node;
            this.razer_fig_sankey.on_click_link = this.on_click_razer_sankey_link;
        }

        this.razer_fig_sankey.draw(data_sankey);
    },

    on_click_razer_sankey_node: function(event, d) {
        console.log('* clicked node', event, d);
        this.show_uids_in_razer_err_list(
            d.uids,
            null
        );
    },

    on_click_razer_sankey_link: function(event, d) {
        console.log('* clicked link', event, d);
        this.show_uids_in_razer_err_list(
            d.uids,
            null
        );
    },

    draw_razer_fig_donut: function() {
        if (this.razer_fig_donut != null) {
            // ??
        }

        // init the chart
        this.razer_fig_donut = {
            option: {
                // grid: {
                //     top: 10,
                //     left: 10,
                //     right: 10,
                //     bottom: 10
                // },
                color: [
                    '#EDC4B3',
                    '#E6B8A2',
                    '#DEAB90',
                    '#D69F7E',
                    '#CD9777',
                    '#C38E70',
                    '#B07D62',
                    '#9D6B53',
                    '#8A5A44',
                    '#774936',
                ],
                tooltip: {
                    trigger: 'item',
                },
                legend: {
                    show: false,
                },
                series: [
                    {
                        name: '',
                        type: 'pie',
                        radius: ['60%', '95%'],
                        avoidLabelOverlap: false,
                        label: {
                            show: false,
                            position: 'center'
                        },
                        emphasis: {
                            label: {
                                show: true,
                                fontSize: '14',
                                fontWeight: 'bold'
                            }
                        },
                        labelLine: {
                            show: false
                        },
                        data: [
                            { value: 1048, name: 'Search Engine' },
                            { value: 735, name: 'Direct' },
                            { value: 580, name: 'Email' },
                            { value: 484, name: 'Union Ads' },
                            { value: 300, name: 'Video Ads' }
                        ]
                    }
                ]
            },
            chart: echarts.init(
                // the default box_id starts with #
                document.getElementById('razer_donut_chart')
            )
        };

        // draw it
        this.razer_fig_donut.chart.setOption(this.razer_fig_donut.option);
    },

    draw_razer_fig_doc_scatter: function() {
        // prepare data first

        // get data
        var data = [];
        var stat = this.razer_dict[this.razer_idx].err_stat.by_doc;
        var max_xy = 5;
        for (const file_hash in stat) {
            var x = stat[file_hash].FP.length;
            var y = stat[file_hash].FN.length;
            if (x > max_xy) {max_xy = x;}
            if (y > max_xy) {max_xy = y;}
            data.push([
                x, y, file_hash
            ]);
        }

        // then check figure status
        if (this.razer_fig_doc_scatter != null) {
            // ??
            this.razer_fig_doc_scatter.option.series[0].data = data;
            this.razer_fig_doc_scatter.chart.setOption(
                this.razer_fig_doc_scatter.option
            );
            return;
        }

        // init the chart
        this.razer_fig_doc_scatter = {
            option: {
                grid: {
                    top: 10,
                    left: 35,
                    right: 10,
                    bottom: 35
                },
                xAxis: {
                    type: 'value',
                    max: max_xy,
                    name: 'False Positive',
                    nameLocation: 'center',
                    nameGap: 20
                },
                yAxis: {
                    type: 'value',
                    max: max_xy,
                    name: 'False Negative',
                    nameLocation: 'center',
                    nameGap: 20
                },
                tooltip: {
                    trigger: 'item',
                    // to avoid CSS z-index overlay issue
                    renderMode: 'richText',
                    formatter: function(params) {
                        // console.log('* hover at', params);
                        var html = [
                            // '<h6>' + params.data[2] + '</h6>',
                            // '<p>- FP Tags: ' + params.data[0] + '<br>', 
                            // '- FN Tags: ' + params.data[1] + '</p>'
                            '' + params.data[2] + '\n',
                            '- FP Tags: ' + params.data[0] + '\n', 
                            '- FN Tags: ' + params.data[1]
                        ].join('');
                        return html;
                    }
                },
                legend: {
                    show: false,
                },
                series: [{
                    name: 'File',
                    type: 'scatter',
                    symbolSize: 5,
                    labelLine: {
                        show: false
                    },
                    data: data
                }]
            },
            chart: echarts.init(
                // the default box_id starts with #
                document.getElementById('razer_fig_doc_scatter')
            )
        };

        // draw it
        this.razer_fig_doc_scatter.chart.setOption(
            this.razer_fig_doc_scatter.option
        );
    },

    draw_razer_fig_doc_heatmap: function() {
        // prepare data first

        // get data 
        // please ensure Math.js is imported
        var vals = {};
        var stat = this.razer_dict[this.razer_idx].err_stat.by_doc;
        for (const file_hash in stat) {
            var x = stat[file_hash].FP.length;
            var y = stat[file_hash].FN.length;
            
            // resize to 10x10
            var _x = x;
            var _y = y;
            if (_x > 10) { _x = 10; };
            if (_y > 10) { _y = 10; };
            
            if (!vals.hasOwnProperty(_x)) {
                vals[_x] = {};
            }
            if (!vals[_x].hasOwnProperty(_y)) {
                vals[_x][_y] = [];
            }
            vals[_x][_y].push(file_hash);
        }
        console.log(vals);
        // get all values
        var data = [];
        var max_n = 10;
        for (let i = 0; i < 11; i++) {
            for (let j = 0; j < 11; j++) {
                if (vals.hasOwnProperty(i) && vals[i].hasOwnProperty(j)) {
                    data.push([
                        i,
                        j,
                        vals[i][j].length
                    ]);
                    if (vals[i][j].length > max_n) {
                        max_n = vals[i][j].length;
                    }
                } else {
                    data.push([
                        i,
                        j,
                        '-'
                    ]);
                }
            }
        }

        // then check figure status
        if (this.razer_fig_doc_heatmap != null) {
            // ??
            this.razer_fig_doc_heatmap.option.series[0].data = data;
            this.razer_fig_doc_heatmap.chart.setOption(
                this.razer_fig_doc_heatmap.option
            );
            return;
        }
        
        var axis_labels = Array.from(Array(11).keys()).map(v=>''+v);
        axis_labels[10] = '10+';
        // init the chart
        this.razer_fig_doc_heatmap = {
            data: data,
            option: {
                grid: {
                    top: 0,
                    left: 35,
                    right: 0,
                    bottom: 80
                },
                visualMap: {
                    min: 0,
                    max: max_n,
                    calculable: true,
                    itemWidth: 15,
                    itemHeight: 180,
                    orient: 'horizontal',
                    left: 30,
                    bottom: 0
                },
                xAxis: {
                    type: 'category',
                    data: axis_labels,
                    name: 'False Positive',
                    nameLocation: 'center',
                    nameGap: 20,
                    axisLabel: {
                        interval: 0,
                    },
                    splitArea: {
                        show: true
                    }
                },
                yAxis: {
                    type: 'category',
                    data: axis_labels,
                    name: 'False Negative',
                    nameLocation: 'center',
                    nameGap: 20,
                    axisLabel: {
                        interval: 0,
                    },
                    splitArea: {
                        show: true
                    }
                },
                tooltip: {
                    trigger: 'item',
                    // to avoid CSS z-index overlay issue
                    renderMode: 'richText',
                    formatter: function(params) {
                        // console.log('* hover at', params);
                        var html = [
                            // '<h6>' + params.data[2] + '</h6>',
                            // '<p>- FP Tags: ' + params.data[0] + '<br>', 
                            // '- FN Tags: ' + params.data[1] + '</p>'
                            '' + params.data[2] + ' file(s) have:\n',
                            '- FP Tags: ' + params.data[0] + '\n', 
                            '- FN Tags: ' + params.data[1]
                        ].join('');
                        return html;
                    }
                },
                legend: {
                    show: false,
                },
                series: [{
                    name: 'File',
                    type: 'heatmap',
                    label: {
                        show: true
                    },
                    data: data,
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 10,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }]
            },
            chart: echarts.init(
                // the default box_id starts with #
                document.getElementById('razer_fig_doc_heatmap')
            )
        };

        // draw it
        this.razer_fig_doc_heatmap.chart.setOption(
            this.razer_fig_doc_heatmap.option
        );
    },

    

    draw_razer_fig_tag_scatter: function() {
        // prepare data first
        if (!this.razer_flag_has_embedding_tsne) {
            // if no embedding data, just skip
            return;
        }

        // get data
        var data = [];
        var err_dict = this.razer_dict[this.razer_idx].err_dict;
        for (const uid in err_dict) {
            var x = err_dict[uid].embedding_tsne[0];
            var y = err_dict[uid].embedding_tsne[1];
            var color = {FP: '#F98686', FN: '#56B3F6'}[err_dict[uid]._judgement];

            if (this.razer_fig_tag_scatter_clr == 'by_err') {
                // nothing
            } else if (this.razer_fig_tag_scatter_clr == 'by_err_cate') {
                if (err_dict[uid].hasOwnProperty('errors') && 
                    err_dict[uid].errors.length > 0) {
                    color = this.razer_err_def_dict.adv_def[
                        err_dict[uid].errors[0].category
                    ].color;
                } else {
                    color = this.razer_err_def_dict.adv_def.UNK.color;
                }
            } else if (this.razer_fig_tag_scatter_clr == 'by_err_type') {
                if (err_dict[uid].hasOwnProperty('errors') && 
                    err_dict[uid].errors.length > 0) {
                    color = this.razer_err_def_dict.adv_def[
                        err_dict[uid].errors[0].type
                    ].color;
                } else {
                    color = this.razer_err_def_dict.adv_def.UNKNOWN.color;
                }
            } else if (this.razer_fig_tag_scatter_clr == 'by_concept') {
                color = this.dtd.tag_dict[
                    err_dict[uid].tag
                ].style.color
            } 
            data.push([
                x, y, uid, color
            ]);
        }

        // then check figure status
        if (this.razer_fig_tag_scatter != null) {
            this.razer_fig_tag_scatter.option.series[0].data = data;
            this.razer_fig_tag_scatter.chart.setOption(
                this.razer_fig_tag_scatter.option
            );
            return;
        }

        // init the chart
        this.razer_fig_tag_scatter = {
            data: data,
            option: {
                grid: {
                    top: 10,
                    left: 25,
                    right: 10,
                    bottom: 25
                },
                toolbox: {
                    feature: {
                        dataZoom: {},
                        brush: {
                            type: ['rect', 'polygon', 'clear']
                        }
                    }
                },
                brush: {},
                xAxis: {
                    type: 'value',
                },
                yAxis: {
                    type: 'value',
                },
                tooltip: {
                    trigger: 'item',
                    // to avoid CSS z-index overlay issue
                    renderMode: 'richText',
                    formatter: function(params) {
                        // console.log('* hover at', params);
                        var tag = app_hotpot.vpp.get_razer_err(params.data[2]);
                        var html = [
                            '' + tag.text + '\n',
                            '* Concept: ' + tag.tag, 
                        ].join('');
                        return html;
                    }
                },
                legend: {
                    show: false,
                },
                series: [{
                    name: 'Tag',
                    type: 'scatter',
                    symbolSize: 5,
                    labelLine: {
                        show: false
                    },
                    itemStyle: {
                        color: function(params) {
                            return params.data[3];
                        }
                    },
                    data: data
                }]
            },
            chart: echarts.init(
                // the default box_id starts with #
                document.getElementById('razer_tag_scatter')
            ),

            // for interaction
            selected_indices: []
        };

        // draw it
        this.razer_fig_tag_scatter.chart.setOption(
            this.razer_fig_tag_scatter.option
        );

        // bind event
        this.razer_fig_tag_scatter.chart.on('brushSelected', function(params) {
            var brushComponent = params.batch[0];
            // console.log('* brush selected:', brushComponent);

            // get all indices
            var selected_indices = [];
            for (var seriesIdx = 0; seriesIdx < brushComponent.selected.length; seriesIdx++) {
                var dataIndices = brushComponent.selected[seriesIdx].dataIndex;
                for (var i = 0; i < dataIndices.length; i++) {
                    var dataIndex = dataIndices[i];
                    selected_indices.push(dataIndex);
                }
            }

            // bind to app_hotpot
            app_hotpot.vpp.$data
                .razer_fig_tag_scatter
                .selected_indices = selected_indices;
        });
    },

    on_change_razer_fig_tag_scatter_color_encoding: function(event) {
        // event.target.value
        this.draw_razer_fig_tag_scatter();
    },

    close_razer_pan_err_def: function() {
        this.is_shown_razer_pan_err_def = false;
        this.razer_active_err_uid = null;
    },

    show_razer_pan_err_def_for_uid: function(event, uid) {
        // set the working uid
        this.razer_active_err_uid = uid;

        // get mouse position
        var x = event.clientX;
        var y = event.clientY;

        this.razer_pan_err_def_right = 5;

        var new_top = y - 110;
        if (new_top + $('#razer_pan_err_def').height() > $('#main_ui').height()) {
            new_top = $('#main_ui').height() - $('#razer_pan_err_def').height() - 1;
        }
        this.razer_pan_err_def_top = new_top;

        // ok, show it
        this.is_shown_razer_pan_err_def = true;
    },

    show_uids_in_razer_err_list: function(uids1, uids2) {
        // empty the current list
        // this.razer_err_list_uids = [];

        if (uids1 == null) {
            if (uids2 == null) {

            } else {
                this.razer_err_list_uids = uids2;
            }
        } else {
            if (uids2 == null) {
                this.razer_err_list_uids = uids1;

            } else {
                this.razer_err_list_uids = uids1.concat(uids2);
            }
        }
    },

    get_html_sentag_by_err: function(err) {
        var tag = err.tag;
        var txt = err.text;
        var sen = err.sentence;

        var colored_txt = '<span class="clr-black mark-tag-' + tag + '">' + 
            txt + 
            '</span>';

        var html = sen.replace(txt, colored_txt);

        return '<span>' + html + '</html>';
    },

    add_razer_err_label: function(err_cate, err_type, uid) {
        var rr = this.get_razer_rst();
        if (rr == null) {
            return null;
        }

        // ok, let's check errors label
        if (!rr.err_dict[uid].hasOwnProperty('errors')) {
            rr.err_dict[uid]['errors'] = [];
        }

        // add this tag?
        rr.err_dict[uid]['errors'].push({
            category: err_cate,
            type: err_type
        });

        // close?
        this.close_razer_pan_err_def();

        // update UI?
        this.update_razer_dict_stats();
    },

    remove_razer_err_label: function(uid, e_idx) {
        this.razer_dict[this.razer_idx].err_dict[uid].errors.splice(e_idx, 1);

        // update UI?
        this.update_razer_dict_stats();
        this.$forceUpdate();

        console.log('* removed error label for ' + uid);
    },

    set_razer_err_labels: function(uid, errors, is_update_ui) {
        if (typeof(is_update_ui) == 'undefined') {
            is_update_ui = false;
        }
        this.razer_dict[this.razer_idx].err_dict[uid]['errors'] = errors;

        if (is_update_ui) {
            this.update_razer_dict_stats();
            this.$forceUpdate();
        }
    },

    set_razer_err_embedding: function(uid, embedding, is_update_ui) {
        if (typeof(is_update_ui) == 'undefined') {
            is_update_ui = false;
        }
        this.razer_dict[this.razer_idx].err_dict[uid]['embedding_tsne'] = embedding

        if (is_update_ui) {
            this.update_razer_dict_stats();
            this.$forceUpdate();
        }
    },

    update_razer_ui: function() {
        this.update_razer_dict_stats();
        this.$forceUpdate();
    },

    download_razer_err_labels: function() {
        var obj = {
            tags: []
        };

        // check all results
        for (const uid in this.razer_dict[this.razer_idx].err_dict) {
            var tag = this.razer_dict[this.razer_idx].err_dict[uid];
            obj.tags.push(tag);
        }

        // let's save
        var fn = this.dtd.name + 
            '-error-labels.' + 
            this.get_date_now() + 
            '.json';
            
        var json_text = JSON.stringify(obj, null, 4);
        var blob = new Blob([json_text], {type: "text/json;charset=utf-8"});
        saveAs(blob, fn);
    },

    show_razer_eaws_panel: function() {
        Metro.dialog.open('#dlg_razer_robot_iet');
    },

    show_razer_embedding_panel: function() {
        Metro.dialog.open('#dlg_razer_embedding_srv');
    },

    show_razer_selected_tags_in_fig_tag_scatter: function() {
        // get the uids
        var uids = [];

        for (let i = 0; i < this.razer_fig_tag_scatter.selected_indices.length; i++) {
            const idx = this.razer_fig_tag_scatter.selected_indices[i];
            // get the data item of this idx
            var d = this.razer_fig_tag_scatter.option.series[0].data[idx];
            // get the uid
            var uid = d[2];
            uids.push(uid);
        }

        // last, call the show function
        this.show_uids_in_razer_err_list(uids, null);
    },

    show_razer_tag_full_text: function(event, uid) {
        console.log('* showing full text for', 
            this.razer_dict[this.razer_idx].err_dict[uid]
        );
    },

    start_razer_eaws: function() {
        var tags = [];
        var docs = {};
        for (const uid in this.razer_dict[this.razer_idx].err_dict) {
            var tag = this.razer_dict[this.razer_idx].err_dict[uid];
            if (tag.hasOwnProperty('errors')) {
                // what to do?
                continue;
            }

            tags.push(tag);
            docs[tag.file_name] = this.razer_dict[this.razer_idx].doc_dict[tag.file_name];
        }

        error_analyzer.use_eaws(
            this.razer_ea_ws_url,
            {
                tags: tags,
                docs: docs
            },
            function(data) {
                console.log('* EAWS returns', data);

                for (let i = 0; i < data.tags.length; i++) {
                    const t = data.tags[i];
                    
                    app_hotpot.vpp.set_razer_err_labels(
                        t.uid,
                        t.errors
                    );

                }
                app_hotpot.vpp.update_razer_ui();
            }
        );
    },

    /**
     * Text Embedding Web Service
     */
    start_razer_tews: function() {
        var tags = [];
        for (const uid in this.razer_dict[this.razer_idx].err_dict) {
            var tag = this.razer_dict[this.razer_idx].err_dict[uid];
            tags.push({
                uid: tag.uid,
                text: tag.text
            });
        }

        error_analyzer.use_tews(
            this.razer_te_ws_url,
            {
                tags: tags,
                is_tsne: true
            },
            function(data) {
                console.log('* TEWS returns', data);

                for (let i = 0; i < data.tags.length; i++) {
                    const t = data.tags[i];
                    
                    app_hotpot.vpp.set_razer_err_embedding(
                        t.uid,
                        t.embedding_tsne
                    );
                }
                app_hotpot.vpp.$data.razer_flag_has_embedding_tsne = true;
                app_hotpot.vpp.update_razer_ui();
            }
        );
    },

    export_razer_report: function() {
        // create each sheet
        var ws_summary = error_analyzer.get_razer_report_summary(
            this.razer_dict[this.razer_idx], 
            'excelws'
        );
        var ws_stat_by_concept = error_analyzer.get_razer_report_stat_by_concept(
            this.razer_dict[this.razer_idx], 
            'excelws'
        );
        var ws_stat_by_err_type = error_analyzer.get_razer_report_stat_by_err_type(
            this.razer_dict[this.razer_idx], 
            this.razer_err_def,
            'excelws'
        );
        var ws_tag_list = error_analyzer.get_razer_report_tag_list(
            this.razer_dict[this.razer_idx], 
            'excelws'
        );

        // create wb for download
        var wb = {
            SheetNames: [
                "Summary",
                "By Concept",
                "By Error Types",
                "Tags and Labels"
            ],
            Sheets: {
                "Summary": ws_summary,
                "By Concept": ws_stat_by_concept,
                "By Error Types": ws_stat_by_err_type,
                "Tags and Labels": ws_tag_list
            }
        };
        console.log(wb);

        // decide the file name for this export
        var fn = this.dtd.name + '-error-analysis-report-' + this.get_date_now() + '.xlsx';

        // download this wb
        XLSX.writeFile(wb, fn);
    }
});