/**
 * This is an extension for schema editor 
 */

/////////////////////////////////////////////////////////////////
// schema editor related variables
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_data, {
    // for schema editor dtd
    se_dtd: null,

    // for making schema from templates
    se_dtd_tpl_id: null,
});

/////////////////////////////////////////////////////////////////
// Schema editor related functions
/////////////////////////////////////////////////////////////////
Object.assign(app_hotpot.vpp_methods, {

    set_se_dtd: function(se_dtd) {
        this.se_dtd = se_dtd;
    },

    create_new_se_dtd: function() {
        var new_se_dtd = dtd_parser.mk_base_dtd('NEW_SCHEMA');

        this.set_se_dtd(new_se_dtd);
    },

    show_schema_editor: function(mode) {
        if (typeof(mode) == 'undefined') {
            mode = 0;
        }

        if (mode == 0) {
            // just open as it is

        } else if (mode == 1) {
            // create a new
            this.create_new_se_dtd();

        } else if (mode == 2) {
            // copy current dtd
            this.se_dtd = JSON.parse(JSON.stringify(this.dtd));

        } else {
            // ?
        }

        // open the dialog
        // Metro.dialog.open('#schema_editor');
        $('.schema-editor').show();
    },

    open_se_dtd: function() {
        // the settings for dtd file
        var pickerOpts = {
            types: [
                {
                    description: 'Annotation Schema File',
                    accept: {
                        'text/dtd': ['.dtd', '.json', '.yaml', '.yml']
                    }
                },
            ],
            excludeAcceptAllOption: true,
            multiple: false
        };

        // get the file handles
        var promise_fileHandles = fs_open_files(pickerOpts);

        promise_fileHandles.then(function(fileHandles) {
            // read the fh and set dtd
            // in fact, there is only one file for this dtd
            for (let i = 0; i < fileHandles.length; i++) {
                const fh = fileHandles[i];

                // read the file
                var p_dtd = fs_read_dtd_file_handle(fh);

                p_dtd.then((function(){
                    return function(dtd) {
                        if (dtd == null) {
                            // must be something wrong
                            app_hotpot.msg(
                                'Something wrong with the dropped file, please check the schema format.', 
                                'warning'
                            );
                            return;
                        }
                        // just set the dtd
                        app_hotpot.vpp.set_se_dtd(dtd);
                    }
                })());
                
                // just one file
                break;
            }
        });

    },

    load_se_dtd_sample: function() {
        if (this.se_dtd_tpl_id == null) {
            // ok, skip this
            app_hotpot.toast('Please select a sample schema');
            return;
        }

        // just alias name
        var sample_name = this.se_dtd_tpl_id;

        // ok, we have some selection here ...
        // for local version, load text through binding
        if (jarvis.hasOwnProperty('sample_dtd')) {
            // get the text from jarvis sample
            var sample_dtd_txt = jarvis.sample_dtd[sample_name];

            // parse the dtd from data
            var dtd = dtd_parser.parse(sample_dtd_txt);

            // set the se dtd
            app_hotpot.vpp.set_se_dtd(dtd);

            return;
        }

        // for web version, just load data through AJAX
        $.ajax({
            url: './static/data/' + sample_name + '.dtd',
            dataType: "text",
            success: function(data, status, xhr) {
                // parse the dtd from data
                var dtd = dtd_parser.parse(data);

                // set the se dtd
                app_hotpot.vpp.set_se_dtd(dtd);

                // toast?
                app_hotpot.toast(
                    'Loaded DTD content',
                    'info'
                );
            },
            error: function (xhr, status, error) {
                console.error(error);

                app_hotpot.toast(
                    'Something wrong when loading DTD, try later?',
                    'warning'
                );
            }
        });
    },

    use_se_dtd_for_annotation: function(se_dtd) {
        // check some conditions
        if (this.dtd == null) {
            // 
        } else {
            if (this.anns.length == 0) {

            } else {
                var ret = window.confirm(
                    'Using this new schema need to clear all annotation files in the list to avoid schema conflicts.\nAre you sure to continue?'
                );

                if (ret) {

                } else {
                    return;
                }

                this.remove_all_ann_files(true);

            }
        }

        // clear other iaa to avoid issues
        this.clear_iaa_all();

        // convert to full dtd first
        var dtd = dtd_parser.extend_base_dtd(se_dtd);
        
        // set dtd
        app_hotpot.set_dtd(dtd);

        // close
        this.close_schema_editor();
    },

    download_se_dtd: function(base_dtd) {
        this.download_se_dtd_as_yaml(base_dtd);
    },

    download_se_dtd_as_yaml: function(base_dtd) {
        // first, convert the base_dtd to text
        var text = dtd_parser.stringify_yaml(
            base_dtd
        );

        // then save it
        // get the current file name
        var fn = base_dtd.name + '.yaml';

        // download this dtd text
        var blob = new Blob(
            [text], 
            {type: "text/txt;charset=utf-8"}
        );
        saveAs(blob, fn);
    },

    download_se_dtd_as_json: function(base_dtd) {
        // first, convert the base_dtd to text
        var text = dtd_parser.stringify_json(
            base_dtd
        );

        // then save it
        // get the current file name
        var fn = base_dtd.name + '.json';

        // download this dtd text
        var blob = new Blob(
            [text], 
            {type: "text/txt;charset=utf-8"}
        );
        saveAs(blob, fn);
    },

    download_se_dtd_as_dtd: function(base_dtd) {
        // first, convert the base_dtd to text
        var text = dtd_parser.stringify(
            base_dtd
        );

        // then save it
        // get the current file name
        var fn = base_dtd.name + '.dtd';

        // download this dtd text
        var blob = new Blob(
            [text], 
            {type: "text/txt;charset=utf-8"}
        );
        saveAs(blob, fn);

    },

    close_schema_editor: function() {
        $('.schema-editor').hide();
    },

    show_att_list_editor: function(att) {
        // get the current value
        var val = att.values.join('|');

        // show the promp
        var ret = window.prompt(
            'Set the items for attribute [' + att.name + ']. Seperate them by "|". \nFor example, apple|banana',
            val
        );

        // update the att values
        if (ret) {
            att.values = ret.split('|');
        } else {
            // nothing to do when no update
        }
    },

    add_se_dtd_tag: function(dtd, etag_or_rtag) {
        if (typeof(etag_or_rtag) == 'undefined') {
            // 0: etag
            // 1: rtag
            etag_or_rtag = 0;
        }

        var tag_type = '';
        if (etag_or_rtag == 0) {
            tag_type = 'etag';
            tag_name = 'NEW_ETAG_' + (dtd.etags.length+1);
        } else {
            tag_type = 'rtag';
            tag_name = 'NEW_RTAG_' + (dtd.rtags.length+1);
        }

        var base_tag = dtd_parser.mk_base_tag(
            tag_name, 
            tag_type
        );

        // add to dtd directly?
        if (etag_or_rtag == 0) {
            dtd.etags.push(base_tag);

        } else {
            dtd.rtags.push(base_tag);
        }
    },

    add_se_dtd_tag_attr: function(dtd, tag_def) {
        var att = dtd_parser.mk_base_attr(
            dtd.name,
            'new_attr_' + (tag_def.attrs.length+1),
            'text'
        )
        
        // add to the given tag??
        tag_def.attrs.push(att);
    },

    remove_se_dtd_tag: function(dtd, tag_def, etag_or_rtag, tag_idx) {
        var ret = window.confirm('Are you sure to remove the tag [' + tag_def.name + ']?');

        if (ret) {
            // ok, go ahead
        } else {
            return;
        }

        if (etag_or_rtag == 0) {
            // etag
            dtd.etags.splice(tag_idx, 1);

        } else {
            dtd.rtags.splice(tag_idx, 1);
        }
    },

    remove_se_dtd_tag_attr: function(dtd, tag_def, att, etag_or_rtag, tag_idx, att_idx) {
        if (att.vtype == 'list') {
            var ret = window.confirm('This attribute contains a list of values ['+att.values.join('|')+']. Are you sure to remove the attribute [' + tag_def.name + '.' + att.name + ']?');

            if (ret) {
                // ok, go ahead
            } else {
                return;
            }
        }
        if (etag_or_rtag == 0) {
            // etag
            dtd.etags[tag_idx].attrs.splice(att_idx, 1);

        } else {
            dtd.rtags[tag_idx].attrs.splice(att_idx, 1);
        }
    },

    is_valid_letter_for_dtd: function(char) {
        if (/^[A-Za-z0-9_]+$/.test(char)) {
            return true;
        } else {
            // Hmm, not match
            return false;
        }
    },

    on_keypress_se_dtd_input: function(event) {
        // get the character
        var char = String.fromCharCode(event.keyCode); 

        if (this.is_valid_letter_for_dtd(char)) {
            return true;
        } else {
            event.preventDefault(); 
        }
    },

    show_se_help: function() {
        // app_hotpot.start_tour_annotation();
        window.open(
            'https://github.com/OHNLP/MedTator/wiki/Annotation-Schema#schema-editor',
            '_blank'
        );
    },
});