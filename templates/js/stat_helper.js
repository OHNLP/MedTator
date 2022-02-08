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

    get_stat_summary_excelws: function(raw_summary) {
        var js = this.get_stat_summary_json(raw_summary);

        var ws = XLSX.utils.json_to_sheet(js);

        return ws;
    }
};