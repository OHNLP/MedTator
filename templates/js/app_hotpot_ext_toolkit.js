Object.assign(app_hotpot.vpp_data, {
    // toolkit
    // 1. medtaggervis
    // 2. POS
    toolkit_section: null
});


Object.assign(app_hotpot.vpp_methods, {
    tk_show_medtaggervis: function() {
        this.tk_show_section('medtagg');
    },

    tk_show_section: function(sec_name) {
        this.toolkit_section = sec_name;
    }
});