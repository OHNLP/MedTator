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

    show_avbrat: function() {
        // init the brat if not
        // fig_bratvis.init();
        $('.annviewer-bratvis').show();

        // first, get the selection
        var cms = app_hotpot.cm_get_selection();

        // get default conversion
        var text = this.anns[this.ann_idx].text;
        var tags = this.anns[this.ann_idx].tags;

        if (cms.sel_txts[0] == '') {
            // which means it's empty
            // nothing to do, just use the whole document for visualization
            // still need to do sentence split
        } else {
            // need to convert to sentence
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

    },

    close_avbrat: function() {
        $('.annviewer-bratvis').hide();
    },

});