/**
 * Annotation schema file parser
 */
var dtd_parser = {
    regex: {
        entity: /\<\!ENTITY\ name\ "([a-zA-Z\-0-9\_]+)"\>/gmi,
        element: /^\<\!ELEMENT\s+([a-zA-Z\-0-9\_]+)\s.+/gmi,
        attr: /^\<\!ATTLIST\s+([a-zA-Z\-0-9\_]+)\s+([a-zA-Z0-9\_]+)\s+(\S+)\s/gmi,
        attr_values: /\(([a-zA-Z0-9\_\ \|\-]+)\)/gmi,
        attr_require: /#([A-Z]+)+(\b["a-zA-Z0-9\-\_\ ]+|\>)/gm,
        attr_prefix: /prefix="([a-zA-Z0-9\_]+)"/gm,
        // attr_cdata_default_value: /(?<=").*?(?=")/gm
        attr_cdata_default_value: /\s+\"(.*)\"/g
    },

    NON_CONSUMING_SPANS: '-1~-1',

    /**
     * Stringify a dtd object into text
     * @param {Object} dtd DTD schema
     */
    stringify: function(dtd, format) {
        if (typeof(format) == 'undefined') {
            format = 'dtd';
        }

        if (format == 'dtd') {
            return this.stringify_dtd(dtd);
        } else if (format == 'json') {
            return this.stringify_json(dtd);
        } else if (format == 'yaml') {
            return this.stringify_yaml(dtd);
        } else {
            return this.stringify_dtd(dtd);
        }
    },

    stringify_dtd: function(dtd) {
        // for the given dtd, convert to strings
        var txt = [];

        // output the dtd name
        txt.push(
            '<!ENTITY name "'+dtd.name+'">'
        );

        // just an empty line for break
        txt.push('');

        // check 
        for (let _t = 0; _t < 2; _t++) {
            var tags = {
                0: dtd.etags,
                1: dtd.rtags
            }[_t];

            for (let i = 0; i < tags.length; i++) {
                const tag = tags[i];

                // for counting the number of IDREF attrs
                var n_lk_att = 0;
                
                // a comment for users
                if (_t == 0) {
                    txt.push('<!-- entity concept [' + tag.name + '] -->');
    
                    // the tag name
                    txt.push('<!ELEMENT ' + tag.name + ' ( #PCDATA ) >')
        
                    // the non-comsuming attr
                    if (tag.is_non_consuming) {
                        txt.push('<!ATTLIST ' + tag.name + ' spans #IMPLIED >')
                    }
                } else {
                    txt.push('<!-- relation concept [' + tag.name + '] -->');
    
                    // the tag name
                    txt.push('<!ELEMENT ' + tag.name + ' EMPTY >')
                }
    
                // check each attr
                for (let j = 0; j < tag.attrs.length; j++) {
                    const att = tag.attrs[j];
                    
                    var att_req = '#IMPLIED'
                    if (att.require == 'REQUIRED') {
                        att_req = '#REQUIRED'
                    }

                    if (att.vtype == 'text') {
                        txt.push('<!ATTLIST ' + tag.name + ' ' + att.name + ' ' + att_req + ' "' + att.default_value + '" >');
                    } 
                    else if (att.vtype == 'list') {
                        var att_vals = att.values.join('|');
                        txt.push('<!ATTLIST ' + tag.name + ' ' + att.name + ' ( '+att_vals+' ) ' + att_req + ' "' + att.default_value + '" >');
                    } 
                    else if (att.vtype == 'idref') {
                        var argN = 'arg' + n_lk_att;
                        txt.push('<!ATTLIST ' + tag.name + ' ' + argN + ' IDREF prefix="' + att.name + '" ' + att_req + ' >');

                        // increase the argN number
                        n_lk_att += 1;
                    }
                }
    
                // just an empty line for break
                txt.push('');
            }
        }

        return txt.join('\n');
    },

    minimize_dtd_json: function(dtd) {
        var j = JSON.parse(JSON.stringify(dtd));

        // remove some attrs
        delete j['id_prefix_dict'];
        delete j['tag_dict'];
        delete j['text'];

        // remove some attrs in etags
        for (let i = 0; i < j.etags.length; i++) {
            delete j.etags[i]['attr_dict'];
            delete j.etags[i]['shortcut'];
            delete j.etags[i]['style'];
            delete j.etags[i]['type'];
            delete j.etags[i]['id_prefix'];

            // remove some attrs in attrs
            for (let k = 0; k < j.etags[i].attrs.length; k++) {
                delete j.etags[i].attrs[k]['element'];
                delete j.etags[i].attrs[k]['type'];
                delete j.etags[i].attrs[k]['require'];

                // delete the values for text attr
                if (j.etags[i].attrs[k]['vtype'] == 'text') {
                    delete j.etags[i].attrs[k]['values'];
                }
            }
        }

        // delete etags if empty
        if (j.etags.length == 0) {
            delete j['etags'];
        }

        // remove some attrs in rtags
        for (let i = 0; i < j.rtags.length; i++) {
            delete j.rtags[i]['attr_dict'];
            delete j.rtags[i]['shortcut'];
            delete j.rtags[i]['style'];
            delete j.rtags[i]['type'];
            delete j.etags[i]['id_prefix'];

            // remove some attrs in attrs
            for (let k = 0; k < j.rtags[i].attrs.length; k++) {
                delete j.rtags[i].attrs[k]['element'];
                delete j.rtags[i].attrs[k]['type'];
                delete j.etags[i].attrs[k]['require'];

                // delete the values for text attr
                if (j.rtags[i].attrs[k]['vtype'] == 'text') {
                    delete j.etags[i].attrs[k]['values'];
                }

                // delete the values for idref
                if (j.rtags[i].attrs[k]['vtype'] == 'idref') {
                    delete j.etags[i].attrs[k]['values'];
                }
            }
        }

        // delete rtags if empty
        if (j.rtags.length == 0) {
            delete j['rtags'];
        }
        
        return j;
    },

    stringify_json: function(dtd) {
        // make a copy 
        var j = this.minimize_dtd_json(dtd);

        // convert to string
        var j_str = JSON.stringify(j, null, 4);
        return j_str;
    },

    stringify_yaml: function(dtd) {
        // make a copy 
        var j = this.minimize_dtd_json(dtd);

        // convert to yaml string
        var y_str = jsyaml.dump(j);

        // add a title
        y_str = "# Annotation Schema: " + dtd.name + "\n" + 
            "# For more information schema design, you can check MedTator Wiki:\n" +
            "# https://github.com/OHNLP/MedTator/wiki/Annotation-Schema \n" +
            y_str;

        return y_str;
    },

    extend_base_dtd: function(base_dtd) {
        var dtd = JSON.parse(JSON.stringify(base_dtd));

        // first, update the attr_dict for each tag
        for (let _t = 0; _t < 2; _t++) {
            var el = {
                0: 'etags',
                1: 'rtags'
            }[_t];

            for (let i = 0; i < dtd[el].length; i++) {
                // init the attr dict
                dtd[el][i].attr_dict = {};
                
                // fill the attr dict
                for (let j = 0; j < dtd[el][i].attrs.length; j++) {
                    var att = dtd[el][i].attrs[j];
                    dtd[el][i].attr_dict[att.name] = att;
                }
            }
        }

        // then, need to decide the `id_prefix_dict` and update the tag_dict
        dtd.id_prefix_dict = {};
        dtd.tag_dict = {};
        for (let _t = 0; _t < 2; _t++) {
            var el = {
                0: 'etags',
                1: 'rtags'
            }[_t];

            for (let i = 0; i < dtd[el].length; i++) {
                // init the id_prefix using the first letter
                dtd[el][i].id_prefix = dtd[el][i].name.substring(0, 1).toLocaleUpperCase();
                
                // search if it is available now
                while (true) {
                    if (dtd.id_prefix_dict.hasOwnProperty(dtd[el][i].id_prefix)) {
                        dtd[el][i].id_prefix = this.get_next_id_prefix(dtd[el][i]);
                    } else {
                        break;
                    }
                }
                
                // yes found at last
                dtd.id_prefix_dict[dtd[el][i].id_prefix] = dtd[el][i];

                // and update the tag_dict
                dtd.tag_dict[dtd[el][i].name] = dtd[el][i];
            }
        }

        // last, add the text
        dtd.text = this.stringify(dtd);

        return dtd;
    },

    /**
     * Parse the given text into the schema object
     * 
     * @param {string} text the annotation schema content
     * @param {string} format the format of schema, dtd/json/yaml
     * @returns the dtd object
     */
    parse: function(text, format) {
        if (typeof(format)=='undefined') {
            format = 'dtd';
        }

        if (format == 'dtd') {
            return this.parse_dtd(text);

        } else if (format == 'json') {
            return this.parse_json(text);

        } else if (format == 'yaml') {
            return this.parse_yaml(text);

        } else {
            // what???
            return null;
        }

    },

    /**
     * Parse the given JSON format string
     * 
     * @param {string} text a JSON string that contains schema
     * @returns the dtd object
     */
    parse_json: function(text) {
        // get the basic 
        var tmp = null;
        try {
            tmp = JSON.parse(text);
        } catch (error) {
            console.log('* invalid JSON content');
            return null;
        }

        // parse the dtd
        var dtd = this._parse_tmp_dtd(tmp);
        // bind the text just as backup?
        // it won't be used
        dtd.text = text;

        // that's it?
        return dtd;
    },

    parse_yaml: function(text) {
        // get the basic 
        var tmp = null;
        try {
            tmp = jsyaml.load(text);

        } catch (error) {
            console.log('* invalid YAML content');
            return null;
        }

        // parse the dtd
        var dtd = this._parse_tmp_dtd(tmp);
        // bind the text just as backup?
        // it won't be used
        dtd.text = text;

        // that's it?
        return dtd;
    },

    _parse_tmp_dtd: function(tmp) {
        // validate the basic elements
        if (!tmp.hasOwnProperty('name')) {
            console.log('* missing name in the given schema');
            return null;
        }

        // OK! let's start!
        // create an empty dtd
        var dtd = this.mk_base_dtd('');

        // set the dtd name
        dtd.name = tmp.name;

        // the schema should contain entity
        if (!tmp.hasOwnProperty('etags')) {
            tmp['etags'] = [];
        }

        // the schema should contain relation but this is optional
        if (!tmp.hasOwnProperty('rtags')) {
            tmp['rtags'] = [];
        }
        
        // loop each entity
        for (let i = 0; i < tmp.etags.length; i++) {
            // get the obj
            var tmp_tag = tmp.etags[i];

            if (!tmp_tag.hasOwnProperty('name')) {
                console.log('* skipped unparsable tag', tmp_tag);
                continue;
            }

            // make an empty tag
            var tag = this.mk_base_tag(tmp_tag.name, 'etag');

            // parse the attrs
            if (!tmp_tag.hasOwnProperty('attrs')) {
                // just set empty attrs
                tmp_tag['attrs'] = [];
            }

            // get all attrs
            for (let i = 0; i < tmp_tag['attrs'].length; i++) {
                var tmp_attr = tmp_tag['attrs'][i];
                
                // create an attr obj by using the tmp_attr
                var attr = this.mk_attr_by_tmp_attr(tmp_tag, tmp_attr);
                
                if (attr == null) {
                    console.log('* skipped unparsable attr', tmp_attr);
                    continue;
                }

                // add this attr to tag
                tag.attrs.push(attr);
                
                // update the tag dict
                tag.attr_dict[attr.name] = attr;
            }
            
            // build by passing values
            if (tmp_tag.hasOwnProperty('is_non_consuming')) {
                // default entity tag is span-based
                tag.is_non_consuming = tmp_tag.is_non_consuming;
            }

            // the last thing for a tag
            if (tmp_tag.hasOwnProperty('id_prefix')) {
                // just set as null, will generate it later
                tag.id_prefix = tmp_tag.id_prefix;
            } else {
                tag.id_prefix = this.get_valid_id_prefix(
                    tag.name,
                    dtd
                );
            }
            // no matter what id prefix is selected,
            dtd.id_prefix_dict[tag.id_prefix] = tag;

            // and update the tag_dict
            dtd.tag_dict[tag.name] = tag;

            // add this tag
            dtd.etags.push(tag);
        }


        // loop relation tags
        for (let i = 0; i < tmp.rtags.length; i++) {
            // get the obj
            var tmp_tag = tmp.rtags[i];

            if (!tmp_tag.hasOwnProperty('name')) {
                console.log('* skipped unparsable tag', tmp_tag);
                continue;
            }
            // make an empty tag
            var tag = this.mk_base_tag(tmp_tag.name, 'rtag');

            // parse the attrs
            if (!tmp_tag.hasOwnProperty('attrs')) {
                // just set empty attrs
                tmp_tag['attrs'] = [];
            }

            // get all attrs
            for (let i = 0; i < tmp_tag['attrs'].length; i++) {
                var tmp_attr = tmp_tag['attrs'][i];
                
                // create an attr obj by using the tmp_attr
                var attr = this.mk_attr_by_tmp_attr(tmp_tag, tmp_attr);
                
                if (attr == null) {
                    console.log('* skipped unparsable attr', tmp_attr);
                    continue;
                }

                // add this attr to tag
                tag.attrs.push(attr);
                
                // update the tag dict
                tag.attr_dict[attr.name] = attr;
            }

            // the last thing for a tag
            if (tmp_tag.hasOwnProperty('id_prefix')) {
                // just set as null, will generate it later
                tag.id_prefix = tmp_tag.id_prefix;
            } else {
                tag.id_prefix = this.get_valid_id_prefix(
                    tag.name,
                    dtd
                );
            }
            // no matter what id prefix is selected,
            dtd.id_prefix_dict[tag.id_prefix] = tag;

            // and update the tag_dict
            dtd.tag_dict[tag.name] = tag;

            // add to dtd
            dtd.rtags.push(tag);
        }

        return dtd;
    },

    parse_dtd: function(text) {
        var lines = text.split('\n');

        var dtd = {
            // schema name
            name: '',

            // the list of entity tags
            etags: [],

            // the list of relation tags
            rtags: [],

            // a dictionary for quick access tags by id_prefix_dict
            id_prefix_dict: {},

            // a dictionary for quick access tags by tag name
            tag_dict: {},

            // the raw dtd text
            text: text
        };

        for (let l = 0; l < lines.length; l++) {
            const line = lines[l];
            
            // check this line
            var ret = this.parse_line(line);

            if (ret == null) {
                // nothing happens
                console.log('* null dtd line: ', line);
                continue;

            } else if (ret.type == 'entity') {
                dtd.name = ret.name;

            } else if (ret.type == 'etag') {
                // check the id by a looping
                while (true) {
                    if (dtd.id_prefix_dict.hasOwnProperty(ret.id_prefix)) {
                        ret.id_prefix = this.get_next_id_prefix(ret);
                    } else {
                        break;
                    }
                }
                dtd.id_prefix_dict[ret.id_prefix] = ret;
                dtd.tag_dict[ret.name] = ret;

            } else if (ret.type == 'rtag') {
                // check the id
                while (true) {
                    if (dtd.id_prefix_dict.hasOwnProperty(ret.id_prefix)) {
                        ret.id_prefix = this.get_next_id_prefix(ret);
                    } else {
                        break;
                    }
                }
                dtd.id_prefix_dict[ret.id_prefix] = ret;
                dtd.tag_dict[ret.name] = ret;

            } else if (ret.type == 'attr') {
                // put this attr to an element
                dtd.tag_dict[ret.element].attrs.push(
                    ret
                );

            } else {
                // what???
            }
        }
        
        // post processing for all tags
        for (const name in dtd.tag_dict) {
            if (Object.hasOwnProperty.call(dtd.tag_dict, name)) {
                if (dtd.tag_dict[name].type == 'etag') { 
                    // check the attr to make sure no missing
                    for (let i = 0; i < dtd.tag_dict[name].attrs.length; i++) {
                        if (dtd.tag_dict[name].attrs[i].vtype == 'dfix') {
                            // which means this is a non-consuming tag
                            dtd.tag_dict[name].is_non_consuming = true;
                        }
                    } 

                }  else {

                    // for link tag, need to check how many attrs are found
                    var cnt_idrefs = 0;
                    for (let i = 0; i < dtd.tag_dict[name].attrs.length; i++) {
                        if (dtd.tag_dict[name].attrs[i].vtype == 'idref') {
                            cnt_idrefs += 1;
                        }
                    }

                    // if there is not idref, just create two:
                    if (cnt_idrefs == 0) {
                        // create from and to
                        var attr_from = this.mk_base_attr(name, 'from', 'idref');
                        var attr_to = this.mk_base_attr(name, 'to', 'idref');
                        dtd.tag_dict[name].attrs = [attr_from, attr_to].concat(
                            dtd.tag_dict[name].attrs
                        );
                        console.log('* added from+to to the attr of ' + name);
                    }
                }
                
            }
        }

        // split the tags
        for (const name in dtd.tag_dict) {
            if (Object.hasOwnProperty.call(dtd.tag_dict, name)) {
                // now, create a attr_dict for each tag
                dtd.tag_dict[name].attr_dict = this.make_attr_dict(
                    dtd.tag_dict[name]
                );

                // last, put this tag to list
                var element = dtd.tag_dict[name];
                if (element.type == 'etag') {
                    dtd.etags.push(element);
                } else {
                    dtd.rtags.push(element);
                }
            }
        }

        return dtd;
    },

    parse_line: function(line) {
        var obj = null;
        var ret = null;

        // try entity
        ret = this.get_entity(line);
        if (ret != null) { return ret; }

        // try element
        ret = this.get_element(line);
        if (ret != null) { return ret; }

        // try attr
        ret = this.get_attr(line);

        return ret;
    },

    get_entity: function(text) {
        let m;
        var ret = null;
        let regex = this.regex.entity;

        while ((m = regex.exec(text)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            
            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                // console.log(`Found entity match, group ${groupIndex}: ${match}`);
                ret = {
                    name: match,
                    type: 'entity'
                };
            });
        }

        return ret;
    },

    get_element: function(line) {
        let m;
        var ret = null;
        let regex = this.regex.element;

        while ((m = regex.exec(line)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            var element = {
                name: '',
                type: 'etag',
                id_prefix: '',
                is_non_consuming: false,
                attrs: []
            };

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                // console.log(`Found element match, group ${groupIndex}: ${match}`);
                // group 0 is the leading line
                if (groupIndex == 1) {
                    element.name = match;
                    element.id_prefix = match.substring(0, 1);
                } 
            });
        
            // check the element type
            if (line.lastIndexOf('EMPTY')>=0) {
                element.type = 'rtag';
            }

            ret = element;
        }

        return ret;

    },

    get_attr: function(line) {
        let m;
        var ret = null;
        let regex = this.regex.attr;

        while ((m = regex.exec(line)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            var attr = this.mk_base_attr('', '', '');
            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                // console.log(`Found attr match, group ${groupIndex}: ${match}`);
                // group 0 is the leading text
                if (groupIndex == 1) {
                    // which is the element name
                    attr.element = match;

                } else if (groupIndex == 2) {
                    // which means it is the attr of this element
                    attr.name = match;

                    // special rule for some attrs
                    if (match == 'spans') {
                        // for attr `spans`, need to update the elememt
                        attr.vtype = 'dfix';
                        attr.default_value = this.NON_CONSUMING_SPANS;
                    }

                } else if (groupIndex == 3) {
                    if (match == 'CDATA') {
                        // ok, it's just a text content
                        attr.vtype = 'text';
                        
                        // then get the default value
                        attr.default_value = this.get_attr_cdata_default_value(line);

                    } else if (match == '(') {
                        // this is a list
                        attr.vtype = 'list';

                        // get the values
                        attr.values = this.get_attr_values(line);

                    } else if (match == 'IDREF') {
                        // it's an attr for link tag
                        attr.vtype = 'idref';

                        if (this.is_argN(attr.name)) {
                            // ok
                        } else {
                            // IDREF's default name must argX
                            // but ... why?
                            console.error('* error name for this "', line, '", attr name should be argX format');
                        }

                        // then, check if there is prefix
                        var prefix = this.get_attr_prefix(line);
                        if (prefix == null) {
                            // which means this attr doesn't have a prefix
                            // for renaming the extraction
                        } else {
                            // use the prefix to replace this name
                            attr.name = prefix;
                        }
                    }
                } else {
                    // what?
                }
            });

            // before end, check the require info
            var require = this.get_attr_require(line);
                        
            if (require.length == 0) {
                // which means this attr has nothing

            } else if (require.length == 1) {
                // which means just has the require name it self
                attr.require = require[0];

            } else if (require.length == 2) {
                // which means it has the default value!
                attr.require = require[0];
                attr.default_value = require[1];
            }

            ret = attr;
        }

        return ret;
    },

    get_attr_values: function(line) {
        let m;
        var ret = [];
        let regex = this.regex.attr_values;

        while ((m = regex.exec(line)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            var values = [];
            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                // console.log(`Found attr values match, group ${groupIndex}: ${match}`);
                // group 0 is the leading text
                if (groupIndex == 1) {
                    // which is the element name
                    var ps = match.split('|');
                    for (let i = 0; i < ps.length; i++) {
                        const p = ps[i];
                        var _p = p.trim();
                        values.push(_p);
                    }
                } 
            });

            ret = values;
        }

        return ret;
    },

    get_attr_require: function(line) {
        let m;
        var ret = [];
        let regex = this.regex.attr_require;

        while ((m = regex.exec(line)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // the final values?
            var values = [];

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                // console.log(`Found attr require match, group ${groupIndex}: ${match}`);
                // group 0 is the leading text
                if (groupIndex == 1) {
                    // which is the require name
                    // IMPLIED or REQUIRED
                    values.push(match)
                } else if (groupIndex == 2) {
                    // get default value 
                    var t = match.replaceAll('"', '');
                    t = t.replaceAll('>', '');
                    t = t.trim();

                    // not matter what is left, save it
                    values.push(t);
                }
            });

            ret = values;
        }

        
        return ret;
    },

    get_attr_prefix: function(line) {
        let m;
        var ret = null;
        let regex = this.regex.attr_prefix;

        while ((m = regex.exec(line)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // the final values?
            var p = null;

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                if (groupIndex == 1) {
                    // which is the prefix text
                    p = match;
                }
            });

            ret = p;
        }
        
        return ret;
    },    

    get_attr_cdata_default_value: function(line) {
        let m;
        var ret = null;
        let regex = this.regex.attr_cdata_default_value;

        while ((m = regex.exec(line)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // the final values?
            var p = null;

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                if (groupIndex == 1) {
                    // which is the prefix text
                    p = match;
                }
            });

            ret = p;
        }
        
        return ret;
    },    

    make_attr_dict: function(tag) {
        let attr_dict = {};

        for (let i = 0; i < tag.attrs.length; i++) {
            attr_dict[tag.attrs[i].name] = tag.attrs[i];
        }

        return attr_dict;
    },

    get_next_id_prefix: function(element) {
        var ret = element.name.substring(
            0,
            element.id_prefix.length + 1
        );

        return ret;
    },

    get_valid_id_prefix: function(tag_name, dtd) {
        // starts with the first letter of the tag_name
        var id_prefix = tag_name.substring(0, 1);

        while (true) {
            if (dtd.id_prefix_dict.hasOwnProperty(id_prefix)) {
                id_prefix = tag_name.substring(
                    0,
                    id_prefix.length + 1
                );
            } else {
                break;
            }
        }

        return id_prefix;
    },

    ///////////////////////////////////////////////////////
    // Utils
    ///////////////////////////////////////////////////////
    get_id_prefix: function(tag_name, dtd) {
        if (dtd.tag_dict.hasOwnProperty(tag_name)) {
            return dtd.tag_dict[tag_name].id_prefix;
        }
        return '';
    },

    is_argN: function(name) {
        if (name.startsWith('arg')) {
            if (/^\d+$/.test(name.substring(3))) {
                return true;
            }
        }
        return false;
    },

    mk_base_attr: function(element, name, vtype) {
        return {
            name: name,
            vtype: vtype,
            require: '',
            values: [],
            default_value: '',

            // element is the tag name
            element: element,
            type: 'attr',
        };
    },

    mk_attr_by_tmp_attr: function(tag, tmp_attr) {
        // name is needed for an attr
        if (!tmp_attr.hasOwnProperty('name')) {
            return null;
        }

        // vtype is needed for an attr
        if (!tmp_attr.hasOwnProperty('vtype')) {
            return null;
        }

        // make an empty attr
        var attr = this.mk_base_attr(
            tag.name,
            tmp_attr.name,
            tmp_attr.vtype
        );

        // set the default value
        if (tmp_attr.hasOwnProperty('require')) {
            attr['require'] = tmp_attr['require'];
        }

        // set the values
        if (tmp_attr.hasOwnProperty('values')) {
            attr['values'] = tmp_attr['values'];
        }

        // set the default value
        if (tmp_attr.hasOwnProperty('default_value')) {
            attr['default_value'] = tmp_attr['default_value'];
        }

        return attr;
    },

    mk_base_tag: function(tag_name, tag_type) {
        return {
            // basic information for a tag
            name: tag_name,
            type: tag_type,
            is_non_consuming: false,
            attrs: [],

            // the followings are decided when extending
            attr_dict: {},
            id_prefix: {},

            // the followings are decided when importing
            shortcut: null,
            style: {
                color: '#333333'
            }
        };
    },

    mk_base_dtd: function(dtd_name) {
        return {
            name: dtd_name,
            etags: [],
            rtags: [],

            // the followings are left null for extending later
            id_prefix_dict: {},
            tag_dict: {},
            text: null
        }
    }
};