Object.assign(app_hotpot.vpp_data, {
    // toolkit
    // 1. medtaggervis
    // 2. POS
    toolkit_section: null,


    // for medtaggervis
    tk_medtaggervis_is_loading_txt_files: false,
    tk_medtaggervis_txt_files: []
});


Object.assign(app_hotpot.vpp_methods, {

    tk_show_section: function(sec_name) {
        this.toolkit_section = sec_name;
    }
});