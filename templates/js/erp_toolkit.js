/**
 * Easy Rule Pack Toolkit
 */
var erp_toolkit = {
    rp: {
        prefix: {
            rsregexp: 'resources_regexp_re'
        }
    },

    ///////////////////////////////////////////////////////
    // Rule Pack Functions
    ///////////////////////////////////////////////////////
    create_new_rulepack: function () {
        return {
            name: '',
            matchrules: [ ],
            rsregexps: [ ],
            contexts: [ ],
            fns: {
                used_resources: 'used_resources.txt',
                resources_rules_matchrules: 'resources_rules_matchrules.txt'
            }
        };
    },

    create_new_matchrule: function () {
        return {
            rule_name: 'cm_fever',
            regexp: '\\b(?i)(?:%reFEVER)\\b',
            location: 'NA',
            enabled: true,
            ignore_case: true,
            norm: 'FEVER'
        };
    },

    create_new_rsregexp: function () {
        return {
            name: 'FEVER',
            text: 'fever\nfebris\nfebrile'
        };
    },

    create_new_context: function() {
        var num = 0;
        if (this.vpp != null) {
            if (this.vpp.rulepack != null) {
                if (typeof(this.vpp.rulepack) != 'undefined') {
                    if (typeof(this.vpp.rulepack.contexts) != 'undefined') {
                        num = this.vpp.rulepack.contexts.length;
                    }
                }
            }
        }
        return {
            name: 'contextRule' + num,
            text: 'regex:(^|\s)\?(?=\s?\w+)~|~pre~|~poss~|~1\ndoes not demonstrate~|~pre~|~neg~|~1\ndid not demonstrate~|~pre~|~neg~|~1\ndo not demonstrate~|~pre~|~neg~|~1'
        };
    },

    rulepack2zip: function(rulepack) {
        var zip = new JSZip();

        // create the file list of regexp
        var txt_fns = '';
        for (var i = 0; i < rulepack.rsregexps.length; i++) {
            var rsregexp = rulepack.rsregexps[i];
            var ffn = 'regexp/' + this.rp.prefix.rsregexp + rsregexp.name + '.txt';
            var txt = rsregexp.text;
            txt_fns += './' + ffn + '\n';
            // add to zip
            zip.file(ffn, txt);
            console.log('* add ' + ffn);
        }
        
        // create the context rules
        for (var i = 0; i < rulepack.contexts.length; i++) {
            var context = rulepack.contexts[i];
            var ffn = 'context/' + context.name + '.txt';
            var txt = context.text;
            txt_fns += './' + ffn + '\n';
            // add to zip
            zip.file(ffn, txt);
            console.log('* add ' + ffn);
        }

        // create the rule file
        var rules = '// ' + rulepack.name + '\n';
        for (let i = 0; i < rulepack.matchrules.length; i++) {
            const matchrule = rulepack.matchrules[i];
            rules += 'RULENAME="' + matchrule.rule_name + '",';
            rules += 'REGEXP="' + matchrule.regexp + '",';
            rules += 'LOCATION="' + matchrule.location + '",';
            rules += 'NORM="' + matchrule.norm + '"\n';
        }
        var rule_fn = 'rules/' + rulepack.fns.resources_rules_matchrules;
        txt_fns += './' + rule_fn + '\n';

        zip.file(rule_fn, rules);
        console.log('* add ' + rule_fn);

        // create the used_resources.txt
        txt_fns += './' + rulepack.fns.used_resources + '\n';
        zip.file(rulepack.fns.used_resources, txt_fns);

        return zip;
    },
    
    ///////////////////////////////////////////////////////
    // Easy Pack Functions
    ///////////////////////////////////////////////////////
    create_new_easypack: function(rule_pack_name) {
        if (typeof(rule_pack_name)=='undefined') {
            rule_pack_name = 'rule_pack_name';
        }
        return {
            name: rule_pack_name,
            contexts: [ this.create_new_context() ],
            ergroups: [ ]
        }
    },

    create_new_ergroup: function(norm, text) {
        // set the default norm
        if (typeof(norm) == 'undefined') {
            norm = 'NAME_' + this.mkid(6);
        } else {
            norm = norm.toLocaleUpperCase();
        }

        // set the default text
        if (typeof(text) == 'undefined') {
            text = '';
        }

        return {
            _is_shown: false,
            norm: norm,
            rule_type: 'cm',
            location: 'NA',
            text: text
        };
    },

    anns2text_dict: function(anns) {
        var text_dict = {};

        for (let i = 0; i < anns.length; i++) {
            const ann = anns[i];
            for (let j = 0; j < ann.tags.length; j++) {
                const tag = ann.tags[j];
                // create the tag_def if not exists
                if (!text_dict.hasOwnProperty(tag.tag)) {
                    // the text_dict is for searching
                    // the texts is for storing
                    text_dict[tag.tag] = {
                        textd: {},
                        texts: []
                    };
                }

                // empty text should be removed

                // but first check the text itself
                if (!tag.hasOwnProperty('text')) {
                    // what?
                    continue;
                }

                var text = tag.text;
                text = text.trim();
                if (text == '') {
                    continue;
                }

                if (text_dict[tag.tag].textd.hasOwnProperty(text)) {
                    // oh, this is NOT a new text
                    // just increase the count
                    text_dict[tag.tag].textd[text] += 1;

                } else {
                    // ok, this is a new text
                    // count +1
                    text_dict[tag.tag].textd[text] = 1;

                    // save this tag
                    text_dict[tag.tag].texts.push(text);
                }
            }
        }

        return text_dict;
    },

    anns2easypack: function(anns, dtd) {
        // first, create an empty easypack
        var easypack = this.create_new_easypack(dtd.name);

        // then create ergroup_dict
        var ergroup_dict = {};

        // using the dtd to init the ergroup_dict
        for (let i = 0; i < dtd.etags.length; i++) {
            const tag = dtd.etags[i];
            
            // create a new ergroup from this tag
            var ergroup = this.create_new_ergroup(tag.name, '');

            // put this ergroup to the dict for furture use
            ergroup_dict[tag.name] = ergroup;
        }

        // then, using the anns to fill the text of each ergroup
        var text_dict = this.anns2text_dict(anns);

        // using this text_dict to fill the ergroup_dict
        for (const tag_name in text_dict) {
            if (Object.hasOwnProperty.call(text_dict, tag_name)) {
                // check each text in each tag_name
                for (let k = 0; k < text_dict[tag_name].texts.length; k++) {
                    const text = text_dict[tag_name].texts[k];

                    // just append this text as a new line
                    ergroup_dict[tag_name].text += text + '\n';
                }
            }
        }

        // last, put the ergroup_dict to easypack.ergroups
        for (const tag_name in ergroup_dict) {
            if (Object.hasOwnProperty.call(ergroup_dict, tag_name)) {
                easypack.ergroups.push(ergroup_dict[tag_name]);
            }
        }

        return easypack;
    },

    easypack2rulepack: function(easypack) {
        // create an empty rule pack for converting
        var rulepack = this.create_new_rulepack();
    
        // now update the simple parts according to the easypack
        rulepack.name = easypack.name;
        rulepack.contexts = easypack.contexts;

        // now update the complex parts according to the easypack
        for (let i = 0; i < easypack.ergroups.length; i++) {
            const ergroup = easypack.ergroups[i];
            var regexp_name = this.norm2regexp_name(ergroup.norm);
            var cm_name = regexp_name.toLowerCase();
            
            // create a matchrule
            var matchrule = this.create_new_matchrule();

            // update the matchrule
            // norm is just the norm
            matchrule.norm = ergroup.norm;
            // location is just the location
            matchrule.location = ergroup.location;
            // rule_name is the comb of rule_type and cm_name
            matchrule.rule_name = ergroup.rule_type + '_' + cm_name;
            // regexp is the comb of regexp_name according to the rule_type
            if (ergroup.rule_type == 'cm') {
                matchrule.regexp = '\\b(?i)(?:%re'+regexp_name+')\\b';

            } else if (ergroup.rule_type == 'rem') {
                matchrule.regexp = '\\b(?i)%re'+regexp_name+'\\b';

            } else {
                matchrule.regexp = '\\b(?i)(?:%re'+regexp_name+')\\b';
            }

            // create a rsregexp(?i)
            var rsregexp = this.create_new_rsregexp();

            // update the rsregexp
            rsregexp.name = regexp_name;
            rsregexp.text = ergroup.text;

            // save the new matchrule and rsregexp
            rulepack.matchrules.push(matchrule);
            rulepack.rsregexps.push(rsregexp);
        }

        return rulepack;
    },
    
    ///////////////////////////////////////////////////////
    // Other Functions
    ///////////////////////////////////////////////////////
    mkid: function(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
            result += characters.charAt(
                Math.floor(Math.random() * charactersLength)
            );
        }
       return result;
    },

    /**
     * Convert the norm to a valid regexp name
     * 
     * @param {string} norm 
     */
    norm2regexp_name: function(norm) {
        return norm.replace(/_/g, "");
    },

    download_zip: function(zip, fn) {
        zip.generateAsync({ type: "blob" }).then((function(fn){
            return function (content) {
                saveAs(content, fn);
            }
        })(fn));
    },

    download_anns_as_zip: function(anns, dtd, fn) {
        // first, convert anns to easypack
        var easypack = this.anns2easypack(anns, dtd);

        // second, convert easypack to rulepack
        var rulepack = this.easypack2rulepack(easypack);

        // then convert this easypack to zip
        var zip = this.rulepack2zip(rulepack)

        // last, save this zip
        this.download_zip(zip, fn);
    }
};