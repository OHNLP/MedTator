/**
 * This is an extension for annviewer brat vis
 */

/////////////////////////////////////////////////////////////////
// annviewer-bratvis related variables
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_data, {

});


/////////////////////////////////////////////////////////////////
// annviewer-bratvis related functions
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_methods, {

    show_avbrat: function() {
        // init the brat if not
        fig_bratvis.init();
        $('.annviewer-bratvis').show();
    },

    show_avbrat_help: function() {

    },

    close_avbrat: function() {
        $('.annviewer-bratvis').hide();
    },

});