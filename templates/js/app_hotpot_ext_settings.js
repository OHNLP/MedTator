/**
 * This is an extension for setting management
 */

/////////////////////////////////////////////////////////////////
// setting management related variables
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_data, {
    // for enable the auto save/load config feature
    // this list will contain all the setting names in cfg
    auto_sl_cfg_names: [],

    // configurations
    cfg: {
        // display the setting panel or not
        enable_show_settings: false,

        // display the old menu dropzone
        enable_display_menu_dropzone_ann: false,

        // auto save the current ann
        auto_save_current_ann: 'disable',

        // auto save the current configs
        auto_sl_current_cfg: 'disable',

        // active tab
        active_setting_tab: 'gui',

        // which algorithm to use as default
        sentence_splitting_algorithm: 'simpledot',

        // render all marks or only the selected marks
        linking_marks_selection: 'all_concepts',

        // show the new UI for ea
        new_ui_for_ea: 'disable',

        // show the new UI for toolkit
        new_ui_for_tk: 'enable',

        // show the new UI for cohen's kappa
        // due to the 
        new_ui_for_ck: 'disable',
    },

    // default cfg for reset
    cfg_default_vals: {}
});


/////////////////////////////////////////////////////////////////
// setting management related functions
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot, {
    init_settings: function() {
        // get the default vals from code
        this.vpp.cfg_default_vals = JSON.parse(JSON.stringify(
            this.vpp.cfg
        ));

        // init 
        this.vpp.init_auto_sl_cfg_names();

        // load settings?
        let local_is_auto_sl_cfg = localStorage.getItem('auto_sl_current_cfg');

        if (local_is_auto_sl_cfg == 'enable') {
            this.vpp.load_local_settings();
        } else {
            // which means it is null or disable
            // just skip
        }
    },
});

/////////////////////////////////////////////////////////////////
// setting management related functions
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_methods, {
    /**
     * Init the list for auto save/load
     */
    init_auto_sl_cfg_names: function() {
        this.auto_sl_cfg_names = [];
        for (const key in this.cfg) {
            if (Object.hasOwnProperty.call(this.cfg, key)) {
                this.auto_sl_cfg_names.push(key);
            }
        }
        console.log('* found ' + this.auto_sl_cfg_names.length + ' config names for auto S/L');
    },

    switch_setting_tab: function(tab) {
        this.cfg.active_setting_tab = tab;
    },

    is_adjudication_working_mode: function() {
        return this.annotation_tab_working_mode == 'adjudication';
    },

    is_auto_save_ann: function() {
        return this.cfg.auto_save_current_ann == 'enable';
    },

    is_auto_sl_cfg: function() {
        return this.cfg.auto_sl_current_cfg == 'enable';
    },

    get_metator_mem: function() {
        // return Math.floor(window.performance.memory.totalJSHeapSize / 1024 / 1024);
        if (window.hasOwnProperty('performance')) {
            if (window.performance.hasOwnProperty('memory')) {
                return Math.floor(window.performance.memory.usedJSHeapSize / 1024 / 1024);
            }
        } else {
            return 'NA';
        }
        return 'NA';
    },

    on_change_setting: function(key) {
        if (this.is_auto_sl_cfg()) {
            this.save_local_setting(key);
        } else {
            // ok, when this feature is disabled,
            // the saved settings should be cleared
            this.clear_local_settings();
        }
    },

    save_local_settings: function() {
        // need to specify which to be saved
        for (let i = 0; i < this.auto_sl_cfg_names.length; i++) {
            const cfg_name = this.auto_sl_cfg_names[i];
            this.save_local_setting(cfg_name);
        }
    },

    clear_local_settings: function() {
        for (let i = 0; i < this.auto_sl_cfg_names.length; i++) {
            const cfg_name = this.auto_sl_cfg_names[i];
            localStorage.removeItem(
                cfg_name
            );
        }
        console.log("* cleared all local settings");
    },

    save_local_setting: function(cfg_name) {
        let cfg_val = this.cfg[cfg_name];
        localStorage.setItem(
            cfg_name,
            cfg_val
        );
        console.log('* saved setting['+cfg_name+'='+cfg_val+'] to localStorage');
    },

    load_local_settings: function() {
        for (let i = 0; i < this.auto_sl_cfg_names.length; i++) {
            const cfg_name = this.auto_sl_cfg_names[i];
            const val = this.cfg[cfg_name];
            var local_val = localStorage.getItem(cfg_name);
            if (local_val == null) {
                // no setting yet
            } else {
                this.cfg[cfg_name] = local_val;
                console.log('* loaded local setting[cfg.' + cfg_name + '=' + local_val + ']');
            }
        }
    },

    on_click_reset_to_default_settings: function() {
        var ret = window.confirm('Attention! If you click the "Reset Settings" button, all settings will be reset to their default values. This action may affect your current annotation work, so please save your work before proceeding with the reset.\nOnce you click the button, the page will NOT refresh automatically. You will need to refresh the page.\nTo avoid losing your current annotation work, please save your progress before resetting the settings. We recommend to reset settings when not annotating.\n\nAre you sure to reset?');

        if (ret) {

        } else {
            return;
        }

        this.reset_local_settings_to_default();

        window.alert("The settings have been reset! Please refresh the page to enable the new settings.");
    },

    reset_local_settings_to_default: function() {
        // first, set values to default
        this.cfg = JSON.parse(JSON.stringify(
            this.cfg_default_vals
        ));

        // second, apply the setting
        for (let i = 0; i < this.auto_sl_cfg_names.length; i++) {
            const cfg_name = this.auto_sl_cfg_names[i];
            this.on_change_setting(cfg_name);
        }
        console.log('* reset cfg settings to default');
    },

    on_click_save_workspace_as_json: function() {
        // first, clear the setting panel
        this.cfg.enable_show_settings = false;

        // second, ask for file name
        var ret = window.prompt('Please specify the workspace name for saving. The output JSON file will be named as vpp_data_WORKSPACE.json. If the workspace name is not given, MedTator will use the schema name as the workspace name.');

        var ws_name = '';
        if (ret == '') {
            if (this.dtd == null) {
                app_hotpot.toast('No schema found for the current workspace.', 'warning');
                return;
            } else {
                ws_name = this.dtd.name;
            }
        } else {
            ws_name = ret;
        }

        jarvis.save_vpp_as(ws_name);
        app_hotpot.toast('Successfully saved workspace as ['+ws_name+']!');
    },
});