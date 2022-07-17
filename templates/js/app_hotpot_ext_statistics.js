Object.assign(app_hotpot.vpp_methods, {
    update_whole_hint_dict: function() {
        // app_hotpot.update_hint_dict_by_anns();
        if (this.anns.length == 0) {
            this.hint_dict = {};
            return;
        }
        var hint_dict = ann_parser.anns2hint_dict(
            this.dtd, 
            this.anns
        );
        this.hint_dict = hint_dict;
        console.log('* updated hint_dict by anns', this.hint_dict);
    },

    download_stat_summary: function() {
        var json = [];

        var stat_items = stat_helper.get_stat_items(
            this.anns,
            this.dtd
        );

        for (let i = 0; i < stat_items.length; i++) {
            const stat_item = stat_items[i];
            json.push({
                item: stat_item[0],
                result: stat_item[1]
            });
        }

        // then convert the json to csv
        var csv = Papa.unparse(json, {
        });

        // download this csv
        var blob = new Blob([csv], {type: "text/tsv;charset=utf-8"});
        var fn = this.get_ruleset_base_name() + '-statistics.csv';
        saveAs(blob, fn);
    },

    download_stat_details: function() {
        // create each sheet 
        // sheet 1. the summary
        var ws_summary = stat_helper.get_stat_summary_excelws(
            stat_helper.get_stat_items(
                this.anns,
                this.dtd
            )
        );

        // sheet 2. the tags
        var ws_docbtag = stat_helper.get_stat_docs_by_tags_excelws(
            this.anns,
            this.dtd
        );

        // create the wb for download
        var wb = {
            SheetNames: [
                "Summary",
                "Documents"
            ],
            Sheets: {
                Summary: ws_summary,
                Documents: ws_docbtag
            }
        };
        console.log(wb);

        // decide the file name for this export
        var fn = this.dtd.name + '-annotation-statistics.xlsx';

        // download this wb
        XLSX.writeFile(wb, fn);
    },

    sort_text_dict_in_hint_dict: function(text_dict) {
        var text_info_list = [];
        for (const text in text_dict) {
            if (Object.hasOwnProperty.call(text_dict, text)) {
                const dict = text_dict[text];
                text_info_list.push({
                    text: text,
                    // that's what we want to sort
                    count: dict.count
                });
            }
        }

        // sort desc
        text_info_list.sort(function(a, b) {
            return b.count - a.count;
        });

        return text_info_list;
    },

    reset_stat_filters: function() {
        // reset stat_filter_min_tokens
        this.stat_filter_min_tokens = 0;
    },

    count_texts_by_stat_fileter: function(tag_def) {
        var cnt = 0;
        
        for (const text in this.hint_dict[tag_def.name].text_dict) {
            // count each text
            if (this.stat_filter_min_tokens == 0 || this.hint_dict[tag_def.name].text_dict[text].count <= this.stat_filter_min_tokens) {
                cnt += 1;
            }
        }
        return cnt;
    },

    on_change_stat_filters: function() {

    },
});