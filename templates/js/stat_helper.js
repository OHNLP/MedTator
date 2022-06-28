/**
 * A helper object for the statistics related functions
 */
var stat_helper = {
    /**
     * Get statistics of given anns on dtd
     * 
     * The return item should contain 3 sub-items:
     * [
     *     label
     *     value,
     *     extend_data
     * ]
     * 
     * The extend_data is an object
     * @param {list} anns anns
     * @param {Object} dtd dtd
     * @returns a list of stat results
     */
    get_stat_items: function(anns, dtd) {
        var items = [
            // the basic statistics
            ['# of documents', anns.length, null],
            ['# of tags in schema', dtd.etags.length, null],
            ['# of annotations', this.count_all_tags(anns), null],

            // the frequents
            [
                '# of annotations per tag', 
                this.calc_avg_tags_per_def(anns, dtd),
                null
            ],
            [
                '# of annotations per doc', 
                this.calc_avg_tags_per_doc(anns),
                null
            ],
            [
                '# of sentences',
                this.count_all_sentences(anns),
                null
            ],
            [
                '# of sentences per doc',
                this.calc_avg_sentences_per_doc(anns),
                null
            ],
            
        ];

        // the number by tags
        var cnt = this.count_tags_by_concepts(anns, dtd);
        for (const tag_name in cnt) {
            if (Object.hasOwnProperty.call(cnt, tag_name)) {
                const val = cnt[tag_name];

                // create a html 
                items.push([
                    '# of ' + tag_name,
                    val,
                    {
                        stat_type: 'tag_count',
                        tag: tag_name
                    }
                ]);
            }
        }

        return items;
    },

    /**
     * Get the statistics summary in JSON format
     * @param {list} raw_summary the raw summary list
     */
    get_stat_summary_json: function(raw_summary) {
        var json = [];

        for (let i = 0; i < raw_summary.length; i++) {
            const s = raw_summary[i];
            json.push({
                'measure': s[0],
                'result': s[1]
            });
        }

        return json;
    },

    /**
     * Get the worksheet of the summary
     * @param {list} raw_summary the raw summary list
     * @returns a XLSX worksheet object 
     */
    get_stat_summary_excelws: function(raw_summary) {
        var js = this.get_stat_summary_json(raw_summary);

        var ws = XLSX.utils.json_to_sheet(js);

        return ws;
    },

    get_stat_docs_by_tags_json: function(anns, dtd) {
        var js = {
            stat: {
                max_by_ann_tag: 0,
                max_by_ann: 0,
                max_by_tag: 0
            },
            rs: [{
                'file_name': 'Summary',
                '_total_tags': 0
            }]
        };

        for (let i = 0; i < anns.length; i++) {
            // each ann is a document
            const ann = anns[i];

            // create a new json object
            var j = {
                'file_name': ann._filename,
                '_total_tags': 0
            };
            
            // to make sure the order of tags, use two loops
            // first, init all the etags
            for (let k = 0; k < dtd.etags.length; k++) {
                const tag = dtd.etags[k];
                // init this tag count
                j[tag.name] = 0;

                // init the first row if not 
                if (!js.rs[0].hasOwnProperty(tag.name)) {
                    js.rs[0][tag.name] = 0;
                }
            }

            // then, init all ltags
            for (let k = 0; k < dtd.ltags.length; k++) {
                const tag = dtd.ltags[k];
                // init this tag count
                j[tag.name] = 0;

                // init the first row if not 
                if (!js.rs[0].hasOwnProperty(tag.name)) {
                    js.rs[0][tag.name] = 0;
                }
            }

            // now, we can count how many tags in this doc
            for (let k = 0; k < ann.tags.length; k++) {
                const tag = ann.tags[k];
                // update the count for this tag
                j[tag.tag] += 1;

                // add a count for max result
                if (j[tag.tag] > js.stat.max_by_ann_tag) {
                    js.stat.max_by_ann_tag = j[tag.tag]
                }

                // update the total of this file
                j['_total_tags'] += 1;

                // update the summary of this concept
                js.rs[0][tag.tag] += 1;

                // add a count for max result
                if (js.rs[0][tag.tag] > js.stat.max_by_tag) {
                    js.stat.max_by_tag = js.rs[0][tag.tag]
                }

                // update the summary of all
                js.rs[0]['_total_tags'] += 1;
            }

            // update the max_by_ann
            if (ann.tags.length > js.stat.max_by_ann) {
                js.stat.max_by_ann = ann.tags.length;
            }

            // ok, done! let's put this j to js list
            js.rs.push(j);
        }

        return js;
    },

    get_stat_docs_by_tags_excelws: function(ann, dtd) {
        var stat = this.get_stat_docs_by_tags_json(ann, dtd);
        var js = stat.rs;

        var ws = XLSX.utils.json_to_sheet(js);

        // now add color to the number cells
        // first, get the max number
        // because the number is counted
        var n_max = this.__get_max_val(js);
        // set a min threshold for this max value
        if (n_max < 10) {
            n_max = 10;
        }
        var func_val2color = function(val) {
            return d3.rgb(
                d3.interpolateReds(val / n_max)
            ).formatHex();
        }
        var func_val2fontc = function(val) {
            if (val / n_max > 0.7) {
                return '#ffffff';
            } else {
                return '#000000';
            }
        }

        // now, check each cell
        for (const coord in ws) {
            if (Object.hasOwnProperty.call(ws, coord)) {
                const obj = ws[coord];
                // skip the system attr
                if (obj.hasOwnProperty('v')) {
                    if (typeof(obj.v) == 'number') {
                        // skip the sum
                        if (coord.startsWith('B')) {
                            continue;
                        }

                        // which means this is a count number
                        // create a color
                        var fg_color = func_val2color(obj.v);
                        var font_color = '#000000';
                        if (obj.v == 0) {
                            fg_color = '#ffffff';
                            font_color = '#cccccc';
                        } else {
                            font_color = func_val2fontc(obj.v);
                        }

                        // set this color
                        ws[coord].s = {
                            fill: {
                                fgColor: {
                                    rgb: fg_color.substring(1)
                                }
                            },
                            font: {
                                color: {
                                    rgb: font_color.substring(1)
                                }
                            }
                        }
                    } else if (typeof(obj.v) == 'string') {
                        // we want to set color for the header
                        if (dtd.tag_dict.hasOwnProperty(obj.v)) {
                            // ok, this is a tag name
                            ws[coord].s = {
                                fill: {
                                    fgColor: {
                                        rgb: dtd.tag_dict[obj.v].style.color.substring(1)
                                    }
                                },
                                font: {
                                    sz: 14
                                }
                            }
                        }
                    } else {
                        // ok, other cell?
                    }
                }
            }
        }

        return ws;
    },


    /**
     * Count the total number of all annotated tags
     * @param {list} anns the anns from vpp
     * @returns the total number annotated tags
     */
    count_all_tags: function(anns) {
        var n = 0;
        for (let i = 0; i < anns.length; i++) {
            for (let j = 0; j < anns[i].tags.length; j++) {
                n += 1;
            }
        }
        return n;
    },

    /**
     * Count the total number of split sentences
     * @param {list} anns the anns from vpp
     * @returns the total number of sentences
     */
    count_all_sentences: function(anns) {
        var n = 0;
        for (let i = 0; i < anns.length; i++) {
            const ann = anns[i];
            if (ann.hasOwnProperty('_sentences')) {
                n += ann._sentences.length;
            }
        }
        return n;
    },

    count_tags_by_concepts: function(anns, dtd) {
        var cnt = {};

        for (const tag_name in dtd.tag_dict) {
            if (Object.hasOwnProperty.call(dtd.tag_dict, tag_name)) {
                const tag_def = dtd.tag_dict[tag_name];
                cnt[tag_def.name] = 0;
            }
        }
        for (let i = 0; i < anns.length; i++) {
            const ann = anns[i];
            for (let j = 0; j < ann.tags.length; j++) {
                const tag = ann.tags[j];
                cnt[tag.tag] += 1;
            }
        }

        return cnt;
    },

    calc_avg_sentences_per_doc: function(anns) {
        if (anns == null || anns.length == 0) {
            return '-';
        }
        var t = this.count_all_sentences(anns);
        return (t/anns.length).toFixed(2);
    },

    calc_avg_tags_per_doc: function(anns) {
        if (anns == null || anns.length == 0) {
            return '-';
        }
        var t = this.count_all_tags(anns);
        return (t/anns.length).toFixed(2);
    },

    calc_avg_tags_per_def: function(anns, dtd) {
        if (anns == null || anns.length == 0) {
            return '-';
        }
        if (dtd == null || dtd.etags.length == 0) {
            return '-';
        }
        return (anns.length / dtd.etags.length).toFixed(2);
    },

    /**
     * stat_helper internal use only
     * @param {list} json the json for the stat report
     * @returns the max value
     */
    __get_max_val: function(json) {
        var max_val = 0;
        // skip the summary, so skip the first row in json
        for (let i = 1; i < json.length; i++) {
            const obj = json[i];
            for (const key in obj) {
                if (key == '_total_tags') {
                    // skip the total column
                    continue;
                }
                if (Object.hasOwnProperty.call(obj, key)) {
                    const val = obj[key];
                    if (val > max_val) {
                        max_val = val;
                    }
                }
            }
        }

        return max_val;
    }
};