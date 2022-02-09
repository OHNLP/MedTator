/**
 * A helper object for the statistics related functions
 */
var stat_helper = {
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
        var js = [];

        for (let i = 0; i < anns.length; i++) {
            // each ann is a document
            const ann = anns[i];

            // create a new json object
            var j = {
                'file_name': ann._filename
            };
            
            // to make sure the order of tags, use two loops
            // first, init all the etags
            for (let k = 0; k < dtd.etags.length; k++) {
                const tag = dtd.etags[k];
                // init this tag count
                j[tag.name] = 0;
            }

            // then, init all ltags
            for (let k = 0; k < dtd.ltags.length; k++) {
                const tag = dtd.ltags[k];
                // init this tag count
                j[tag.name] = 0;
            }

            // now, we can count how many tags in this doc
            for (let k = 0; k < ann.tags.length; k++) {
                const tag = ann.tags[k];
                // update the count
                j[tag.tag] += 1;
            }

            // ok, done! let's put this j to js list
            js.push(j);
        }

        return js;
    },

    get_stat_docs_by_tags_excelws: function(ann, dtd) {
        var js = this.get_stat_docs_by_tags_json(ann, dtd);

        var ws = XLSX.utils.json_to_sheet(js);

        // now add color to the number cells
        // first, get the max number
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

        // now, check each cell
        for (const coord in ws) {
            if (Object.hasOwnProperty.call(ws, coord)) {
                const obj = ws[coord];
                // skip the system attr
                if (obj.hasOwnProperty('v')) {
                    if (typeof(obj.v) == 'number') {
                        // which means this is a count number
                        // create a color
                        var fg_color = func_val2color(obj.v);
                        var font_color = '#000000';
                        if (obj.v == 0) {
                            fg_color = '#ffffff';
                            font_color = '#cccccc';
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

    __get_max_val: function(json) {
        var max_val = 0;
        for (let i = 0; i < json.length; i++) {
            const obj = json[i];
            for (const key in obj) {
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