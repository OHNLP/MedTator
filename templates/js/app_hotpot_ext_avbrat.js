/**
 * This is an extension for annviewer brat vis
 */

/////////////////////////////////////////////////////////////////
// annviewer-bratvis related variables
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_data, {
    avbrat_is_rendering: true
});


/////////////////////////////////////////////////////////////////
// annviewer-bratvis related functions
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_methods, {

    show_avbrat: function(flag_enable_selection_vis) {
        if (this.dtd == null || 
            this.anns.length == 0 || 
            this.ann_idx == null) {
            // when no schema, not ann, or no selected
            // just skip
            app_hotpot.toast(
                'Please ensure the annotation schema is loaded and a document is selected for visualization.',
                'warning'
            );
            return;
        }
        if (typeof(flag_enable_selection_vis) == 'undefined') {
            flag_enable_selection_vis = true;
        }
        // init the brat if not
        // fig_bratvis.init();
        $('.annviewer-bratvis').show();

        // get default conversion
        var text = this.anns[this.ann_idx].text;
        var tags = this.anns[this.ann_idx].tags;

        // first, get the selection
        if (flag_enable_selection_vis) {
            
        var cms = app_hotpot.cm_get_selection();

            if (cms.sel_txts[0] == '') {
                // which means the selection is empty
                // nothing to do, just use the whole document for visualization
                // still need to do sentence split? no

            } else {
                // need to convert to sentence
                var spans = app_hotpot.cm_range2spans(
                    cms.sel_locs[0],
                    this.anns[this.ann_idx]
                );
                // update the text
                text = ann_parser.get_text_by_spans(
                    spans,
                    this.anns[this.ann_idx].text
                );
                // update the tags
                tags = ann_parser.get_subtags_of_substr_in_ann(
                    spans,
                    this.anns[this.ann_idx],
                    this.dtd,
                    true, // update the offset of tags to the substring
                );
            }
        }

        // for brat vis:
        // 1. get coll data
        var collData = brat_parser.make_collection_data_by_dtd(
            this.dtd
        );
        console.log('* get brat collData:', collData);

        // 2. get doc data
        var docData = brat_parser.make_document_data(
            text,
            tags,
            this.dtd
        );
        console.log('* get brat docData:', docData);

        // 3. vis!
        fig_bratvis.visualize(
            collData,
            docData
        );

        this.avbrat_is_rendering = false;
    },

    export_avbrat_figure: function() {

    },

    show_avbrat_help: function() {
        this.show_help('avbrat_help_how_to_use');
    },

    close_avbrat: function() {
        $('.annviewer-bratvis').hide();
    },

});