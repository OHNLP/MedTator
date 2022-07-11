/**
 * Annotation schema file parser
 */
var dtd_parser = {
    regex: {
        entity: /\<\!ENTITY\ name\ "([a-zA-Z\-0-9\_]+)"\>/gmi,
        element: /^\<\!ELEMENT\s+([a-zA-Z\-0-9\_]+)\s.+/gmi,
        attlist: /^\<\!ATTLIST\s+([a-zA-Z\-0-9\_]+)\s+([a-zA-Z0-9\_]+)\s+(\S+)\s/gmi,
        attlist_values: /\(([a-zA-Z0-9\_\ \|\-]+)\)/gmi,
        attlist_require: /#([A-Z]+)+(\b["a-zA-Z0-9\-\_\ ]+|\>)/gm,
        attlist_prefix: /prefix="([a-zA-Z0-9\_]+)"/gm,
        // attlist_cdata_default_value: /(?<=").*?(?=")/gm
        attlist_cdata_default_value: /\s+\"(.*)\"/g
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
        }

        return this.stringify_dtd(dtd);
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
                1: dtd.ltags
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
                for (let j = 0; j < tag.attlists.length; j++) {
                    const att = tag.attlists[j];
                    
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

    extend_base_dtd: function(base_dtd) {
        var dtd = JSON.parse(JSON.stringify(base_dtd));

        // first, update the attlist_dict for each tag
        for (let _t = 0; _t < 2; _t++) {
            var el = {
                0: 'etags',
                1: 'ltags'
            }[_t];

            for (let i = 0; i < dtd[el].length; i++) {
                // init the attlist dict
                dtd[el][i].attlist_dict = {};
                
                // fill the attlist dict
                for (let j = 0; j < dtd[el][i].attlists.length; j++) {
                    var att = dtd[el][i].attlists[j];
                    dtd[el][i].attlist_dict[att.name] = att;
                }
            }
        }

        // then, need to decide the `id_prefixd` and update the tag_dict
        dtd.id_prefixd = {};
        dtd.tag_dict = {};
        for (let _t = 0; _t < 2; _t++) {
            var el = {
                0: 'etags',
                1: 'ltags'
            }[_t];

            for (let i = 0; i < dtd[el].length; i++) {
                // init the id_prefix using the first letter
                dtd[el][i].id_prefix = dtd[el][i].name.substring(0, 1).toLocaleUpperCase();
                
                // search if it is available now
                while (true) {
                    if (dtd.id_prefixd.hasOwnProperty(dtd[el][i].id_prefix)) {
                        dtd[el][i].id_prefix = this.get_next_id_prefix(dtd[el][i]);
                    } else {
                        break;
                    }
                }
                
                // yes found at last
                dtd.id_prefixd[dtd[el][i].id_prefix] = dtd[el][i];

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
        var dtd = null;

        return dtd;
    },

    parse_yaml: function(text) {
        var dtd = null;

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
            ltags: [],

            // a dictionary for quick access tags by id_prefix
            id_prefixd: {},

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
                    if (dtd.id_prefixd.hasOwnProperty(ret.id_prefix)) {
                        ret.id_prefix = this.get_next_id_prefix(ret);
                    } else {
                        break;
                    }
                }
                dtd.id_prefixd[ret.id_prefix] = ret;
                dtd.tag_dict[ret.name] = ret;

            } else if (ret.type == 'ltag') {
                // check the id
                while (true) {
                    if (dtd.id_prefixd.hasOwnProperty(ret.id_prefix)) {
                        ret.id_prefix = this.get_next_id_prefix(ret);
                    } else {
                        break;
                    }
                }
                dtd.id_prefixd[ret.id_prefix] = ret;
                dtd.tag_dict[ret.name] = ret;

            } else if (ret.type == 'attr') {
                // put this attr to an element
                dtd.tag_dict[ret.element].attlists.push(
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
                    // check the attlist to make sure no missing
                    for (let i = 0; i < dtd.tag_dict[name].attlists.length; i++) {
                        if (dtd.tag_dict[name].attlists[i].vtype == 'dfix') {
                            // which means this is a non-consuming tag
                            dtd.tag_dict[name].is_non_consuming = true;
                        }
                    } 

                }  else {

                    // for link tag, need to check how many attlists are found
                    var cnt_idrefs = 0;
                    for (let i = 0; i < dtd.tag_dict[name].attlists.length; i++) {
                        if (dtd.tag_dict[name].attlists[i].vtype == 'idref') {
                            cnt_idrefs += 1;
                        }
                    }

                    // if there is not idref, just create two:
                    if (cnt_idrefs == 0) {
                        // create from and to
                        var attlist_from = this.mk_attlist(name, 'from', 'idref');
                        var attlist_to = this.mk_attlist(name, 'to', 'idref');
                        dtd.tag_dict[name].attlists = [attlist_from, attlist_to].concat(
                            dtd.tag_dict[name].attlists
                        );
                        console.log('* added from+to to the attlist of ' + name);
                    }
                }
                
            }
        }

        // split the tags
        for (const name in dtd.tag_dict) {
            if (Object.hasOwnProperty.call(dtd.tag_dict, name)) {
                // now, create a attlist_dict for each tag
                dtd.tag_dict[name].attlist_dict = this.make_attlist_dict(
                    dtd.tag_dict[name]
                );

                // last, put this tag to list
                var element = dtd.tag_dict[name];
                if (element.type == 'etag') {
                    dtd.etags.push(element);
                } else {
                    dtd.ltags.push(element);
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

        // try attlist
        ret = this.get_attlist(line);

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
                attlists: []
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
                element.type = 'ltag';
            }

            ret = element;
        }

        return ret;

    },

    get_attlist: function(line) {
        let m;
        var ret = null;
        let regex = this.regex.attlist;

        while ((m = regex.exec(line)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            var attlist = this.mk_attlist();
            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                // console.log(`Found attlist match, group ${groupIndex}: ${match}`);
                // group 0 is the leading text
                if (groupIndex == 1) {
                    // which is the element name
                    attlist.element = match;

                } else if (groupIndex == 2) {
                    // which means it is the attr of this element
                    attlist.name = match;

                    // special rule for some attrs
                    if (match == 'spans') {
                        // for attr `spans`, need to update the elememt
                        attlist.vtype = 'dfix';
                        attlist.default_value = this.NON_CONSUMING_SPANS;
                    }

                } else if (groupIndex == 3) {
                    if (match == 'CDATA') {
                        // ok, it's just a text content
                        attlist.vtype = 'text';
                        
                        // then get the default value
                        attlist.default_value = this.get_attlist_cdata_default_value(line);

                    } else if (match == '(') {
                        // this is a list
                        attlist.vtype = 'list';

                        // get the values
                        attlist.values = this.get_attlist_values(line);

                    } else if (match == 'IDREF') {
                        // it's an attr for link tag
                        attlist.vtype = 'idref';

                        if (this.is_argN(attlist.name)) {
                            // ok
                        } else {
                            // IDREF's default name must argX
                            // but ... why?
                            console.error('* error name for this "', line, '", attlist name should be argX format');
                        }

                        // then, check if there is prefix
                        var prefix = this.get_attlist_prefix(line);
                        if (prefix == null) {
                            // which means this attlist doesn't have a prefix
                            // for renaming the extraction
                        } else {
                            // use the prefix to replace this name
                            attlist.name = prefix;
                        }
                    }
                } else {
                    // what?
                }
            });

            // before end, check the require info
            var require = this.get_attlist_require(line);
                        
            if (require.length == 0) {
                // which means this attlist has nothing

            } else if (require.length == 1) {
                // which means just has the require name it self
                attlist.require = require[0];

            } else if (require.length == 2) {
                // which means it has the default value!
                attlist.require = require[0];
                attlist.default_value = require[1];
            }

            ret = attlist;
        }

        return ret;
    },

    get_attlist_values: function(line) {
        let m;
        var ret = [];
        let regex = this.regex.attlist_values;

        while ((m = regex.exec(line)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }
            var values = [];
            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                // console.log(`Found attlist values match, group ${groupIndex}: ${match}`);
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

    get_attlist_require: function(line) {
        let m;
        var ret = [];
        let regex = this.regex.attlist_require;

        while ((m = regex.exec(line)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            // the final values?
            var values = [];

            // The result can be accessed through the `m`-variable.
            m.forEach((match, groupIndex) => {
                // console.log(`Found attlist require match, group ${groupIndex}: ${match}`);
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

    get_attlist_prefix: function(line) {
        let m;
        var ret = null;
        let regex = this.regex.attlist_prefix;

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

    get_attlist_cdata_default_value: function(line) {
        let m;
        var ret = null;
        let regex = this.regex.attlist_cdata_default_value;

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

    make_attlist_dict: function(tag) {
        let attlist_dict = {};

        for (let i = 0; i < tag.attlists.length; i++) {
            attlist_dict[tag.attlists[i].name] = tag.attlists[i];
        }

        return attlist_dict;
    },

    get_next_id_prefix: function(element) {
        var ret = element.name.substring(
            0,
            element.id_prefix.length + 1
        );

        return ret;
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

    mk_attlist: function(element='', name='', vtype='') {
        return {
            element: element,
            name: name,
            type: 'attr',
            vtype: vtype,
            require: '',
            values: [],
            default_value: '',
        };
    },

    mk_base_tag: function(tag_name, tag_type) {
        return {
            // basic information for a tag
            name: tag_name,
            type: tag_type,
            is_non_consuming: false,
            attlists: [],

            // the followings are decided when extending
            attlist_dict: null,
            id_prefixd: null,

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
            ltags: [],

            // the followings are left null for extending later
            id_prefixd: null,
            tag_dict: null,
            text: null
        }
    }
};