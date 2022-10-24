/**
 * Annotation file parser
 * 
 * The ann used in this tool is an object following this format:
 * {
 *  _fh: FileSystemHandle,
 *  _has_saved: true/false,
 *  text: '',
 *  dtd_name: '',
 *  tags: [{
 *    id: '',
 *    tag: '',
 *    spans: '', // this may not be available
 *    text: '',  // this may not be available
 * 
 *  }]
 * }
 * 
 * the `_fh` is added outside of parser.
 * the `_has_saved` is added outside
 */
var ann_parser = {
    NON_CONSUMING_SPANS: '-1~-1',


    ///////////////////////////////////////////////////////
    // Annotation serialization/deserialization functions
    ///////////////////////////////////////////////////////
    txt2ann: function(txt, dtd) {
        var ann = {
            text: txt,
            dtd_name: dtd.name,
            tags: [],
            meta: {},  // the meta data of this annotation
            
            // other info
            _fh: null,
            _filename: null,
            _has_saved: true,
            _sentences: [],
            _sentences_text: ''
        };

        return ann;
    },

    xml2ann: function(xml_text, dtd) {
        // create a new DOM parser
        var parser = new DOMParser();

        // parse the given text
        var xmlDoc = parser.parseFromString(xml_text, "text/xml");

        // create an empty ann
        var ann = {
            text: '',
            dtd_name: '',
            tags: [],
            meta: {},  // the meta data of this annotation
            
            // other info
            _fh: null,
            _filename: null,
            _has_saved: true,
            _sentences: [],
            _sentences_text: ''
        };

        // first, get the dtd name
        var dtd_name = xmlDoc.children[0].tagName;
        ann.dtd_name = dtd_name;

        if (dtd.name != ann.dtd_name) {
            throw {
                name: 'Not match given DTD',
                message: 'The task name in XML (' + ann.dtd_name + ') does NOT match the given DTD (' + dtd.name + ')'
            };
        }

        // then get the text content
        var textContent = xmlDoc.getElementsByTagName('TEXT')[0].textContent;
        ann.text = textContent;

        // then check all of the tags
        if (xmlDoc.getElementsByTagName('TAGS').length == 0) {
            // it's possible that there is no tags at all
            // then we could skip
        } else {
            var elems = xmlDoc.getElementsByTagName('TAGS')[0].children;

            for (let i = 0; i < elems.length; i++) {
                var elem = elems[i];

                // get the attributes
                var tag_name = elem.tagName;

                // first, need to if this tag_name is supported in current dtd
                if (dtd.tag_dict.hasOwnProperty(tag_name)) {
                    // OK, there it is
                } else {
                    // no such tag??
                    console.log("* not found", tag_name, 'in current dtd');
                    continue;
                }

                // create a new empty tag
                var tag = {
                    tag: tag_name
                };

                // get all attr names
                var attrs = elem.getAttributeNames();

                // get all attr values
                for (let j = 0; j < attrs.length; j++) {
                    var attr = attrs[j];
                    var value = elem.getAttribute(attr);

                    // there are exceptions
                    if (attr.toLocaleLowerCase() == 'text') {
                        // special rule for the text attr
                        // due to the bad convertion
                        tag['text'] = value;

                    } else if (attr.toLocaleLowerCase() == 'spans') {
                        // special rule for the text attr
                        // due to the bad convertion
                        // tag['spans'] = value;

                        // fix the wrong values
                        var locs = this.spans2locs(value);
                        var spans = this.locs2spans(locs);

                        if (value != spans) {
                            console.log('* fixed wrong format spans ' + value + ' -> ' + spans);
                        }
                        tag['spans'] = spans;

                    } else if (attr.endsWith('ID')) {
                        // omg, this may be a link tag
                        // let's check if there is a xxxText attr
                        var attr_prefix_name = attr.substring(0, attr.length-2);
                        var attrText_name = attr_prefix_name + 'Text';
                        if (attrs.indexOf(attrText_name)>=0) {
                            // ok, I'm sure this is a idref att
                            // the value is the etag id
                            // let's save it and goto next
                            tag[attr_prefix_name] = value;
                            continue;

                        } else {
                            // what??? ok, this is just a normal but weird attr
                            // just save it later

                        }
                    } else if (attr.endsWith('Text')) {
                        // I guess we could skip this one
                        continue;

                    } else if (attr.startsWith('_')) {
                        // which means this a special attribute
                        // for example, _annotator
                        var attr_lower = attr.toLocaleLowerCase();
                        tag[attr] = value;

                    } else {
                        // other special rule? maybe
                        // put this value into tag
                        tag[attr] = value;
                    }
                }

                // one more step, need to check whether this tag belongs to dtd
                // if not, skip the next step
                if (dtd.tag_dict.hasOwnProperty(tag_name)) {
                    // one more step, sometimes the attr in XML doesn't contain
                    // what defined in the dtd, so we need to give a value
                    for (let k = 0; k < dtd.tag_dict[tag_name].attrs.length; k++) {
                        const att = dtd.tag_dict[tag_name].attrs[k];
                        if (tag.hasOwnProperty(att.name)) {
                            // ok, that's what it should be
                        } else {
                            // also ok, that's what it actually is sometimes
                            tag[att.name] = att.default_value;                            
                            console.log('* fixed missing '+tag.id+' attr['+att.name+']');
                        }
                    }

                    // check the text attr for entity tags
                    if (dtd.tag_dict[tag_name].type == 'etag') {
                        if (tag.hasOwnProperty('text')) {

                        } else {
                            if (tag.spans == '-1~-1') {
                                tag.text = '';
                            } else {
                                tag.text = this.get_text_by_spans(tag.spans, ann.text);
                            }
                        }
                    }
                } else {
                    console.log('* undefined [' + tag_name + '] in dtd');
                }
                // console.log('* add tag', tag);

                // then, put this new tag to the ann tags list
                ann.tags.push(tag);
            }
        }

        // then check all of the meta data
        if (xmlDoc.getElementsByTagName('META').length == 0) {
            // it's very very possible that no meta data
            // then just skip
        } else {
            // Wow! that's great!
            // We found some meta data for this annotation!
            // just save everything to `ann.meta`?

            // check all
            var elems = xmlDoc.getElementsByTagName('META')[0].children;
            for (let i = 0; i < elems.length; i++) {
                var elem = elems[i];

                // get the attributes
                var tag_name = elem.tagName;

                // decide the format
                if (ann.meta.hasOwnProperty(tag_name)) {
                    // nothing to do
                } else {
                    // we assume each tag may have multiple tags
                    ann.meta[tag_name] = [];
                }

                // get all attr names
                var attrs = elem.getAttributeNames();

                // create a temp obj
                var obj = {};

                // put all attrs 
                for (let j = 0; j < attrs.length; j++) {
                    var attr = attrs[j];
                    var value = elem.getAttribute(attr);

                    // put value
                    obj[attr] = value;
                }

                // save this obj
                ann.meta[tag_name].push(obj);
            }
        }

        return ann;
    },

    ann2xml: function(ann, dtd) {
        // create the root document
        var xmlDoc = document.implementation.createDocument(
            null, ann.dtd_name
        );
        var root = xmlDoc.getElementsByTagName(ann.dtd_name)[0];
        // var root = xmlDoc.getRootNode();

        // create the CDATA section for TEXT
        var node_TEXT = xmlDoc.createElement('TEXT');
        node_TEXT.appendChild(
            xmlDoc.createCDATASection(ann.text)
        );
        root.appendChild(node_TEXT);

        // create the tags
        var node_TAGS = xmlDoc.createElement('TAGS');
        for (let i = 0; i < ann.tags.length; i++) {
            const tag = ann.tags[i];

            // create a node for this tag
            var node_tag = xmlDoc.createElement(tag.tag);

            // create all attributes
            for (const attr in tag) {
                // skip special tags
                if (attr.startsWith('_')) {
                    // internal attributes
                    // _annotator
                    // _
                    // continue;
                    node_tag.setAttribute(attr, tag[attr]);
                    continue;
                }

                if (attr == 'tag') {
                    // skip the tag name itself
                    continue;
                }

                if (tag[attr] == null) {
                    // skip those null values in xml
                    continue;
                }

                if (attr == 'id') {
                    // quick save this attr
                    node_tag.setAttribute(attr, tag[attr]);
                    continue;
                }

                if (dtd.tag_dict[tag.tag].type == 'etag') {
                    node_tag.setAttribute(attr, tag[attr]);
                    continue;

                } else if (dtd.tag_dict[tag.tag].type == 'rtag') {
                    // for link tag, spans and text are not required
                    if (attr == 'spans') { continue; }
                    if (attr == 'text') { continue; }

                    // due to schema version issue, 
                    // the attribute may not exist in current schema
                    if (!dtd.tag_dict[tag.tag].attr_dict.hasOwnProperty(attr)) {
                        continue;
                    }
                
                    // for those link tag, need to check 
                    if (dtd.tag_dict[tag.tag].attr_dict[attr].vtype == 'idref') {
                        // so, this attr is a id ref,
                        // the value is a tag_id of an etag
                        // to be compatible with MAE format,
                        // we need to set 2 attributes if the value is not null
                        if (tag[attr] == null || tag[attr] == '') {
                            // if the value is empty, just skip this
                            continue;
                        }
                        // first, the xxxID
                        // second, the xxxText
                        // so, let's get the text first
                        var etag = this.get_tag_by_tag_id(tag[attr], ann);
                        if (etag == null) {
                            // ??? how could it be?
                            // well...skip this one
                            console.log('* not found etag [', attr, '] in ', tag);
                            continue;
                        }

                        // great! the etag is not null
                        node_tag.setAttribute(attr + 'ID', tag[attr]);
                        node_tag.setAttribute(attr + 'Text', etag.text);

                    } else {
                        // bind this node_attr to the node_tag
                        node_tag.setAttribute(attr, tag[attr]);
                    }
                }
            }

            // append this node to TAGS
            node_TAGS.appendChild(node_tag);
        }
        root.appendChild(node_TAGS);

        if (!ann.hasOwnProperty('meta')) {
            // this is old format, there is no meta
            return xmlDoc;
        }

        // create the meta
        var node_META = xmlDoc.createElement('META');
        for (const key in ann.meta) {
            if (Object.hasOwnProperty.call(ann.meta, key)) {
                const objs = ann.meta[key];
                
                // objs is a list of items of this key

                for (let i = 0; i < objs.length; i++) {
                    const obj = objs[i];

                    // create a node for this tag
                    var node_tag = xmlDoc.createElement(key);
                    
                    // save this obj
                    for (const attr in obj) {
                        node_tag.setAttribute(attr, obj[attr]);
                    }

                    // save this node
                    node_META.appendChild(node_tag);
                }
            }
        }
        root.appendChild(node_META);
        
        return xmlDoc;
    },

    xml2str_v1: function(xmlDoc, pretty) {
        const serializer = new XMLSerializer();
        var xmlStr = serializer.serializeToString(xmlDoc);

        // fix missing 
        if (xmlStr.startsWith('<?xml')) {
            // nothing, it' OK
        } else {
            xmlStr = '<?xml version="1.0" encoding="UTF-8" ?>\n' + xmlStr;
        }

        if (typeof(pretty)=='undefined') {
            pretty = true;
        }

        if (pretty) {
            // var pretty_xmlStr = vkbeautify.xml(xmlStr, 0);
            // return pretty_xmlStr;
            var format = require('xml-formatter');
            formattedXml = format(xmlStr, {
                indentation: ''
            });
        }

        return xmlStr;
    },

    xml2str: function(xml_doc) {
        const serializer = new XMLSerializer();
        var xml_str_TEXT = serializer.serializeToString(xml_doc.getElementsByTagName('TEXT')[0]);
        var xml_str_TAGS = serializer.serializeToString(xml_doc.getElementsByTagName('TAGS')[0]);
        var xml_str_META = serializer.serializeToString(xml_doc.getElementsByTagName('META')[0]);

        // format the XML to make it looks better for human
        var format = require('xml-formatter');
        var xml_str_TAGS_formatted = format(xml_str_TAGS, {
            indentation: ''
        });
        var xml_str_META_formatted = format(xml_str_META, {
            indentation: ''
        });

        var root_name = xml_doc.children[0].nodeName;

        var xml_str = [
            '<?xml version="1.0" encoding="UTF-8" ?>',
            '<' + root_name + '>',
            xml_str_TEXT,
            xml_str_TAGS_formatted,
            xml_str_META_formatted,
            '</' + root_name + '>'
        ].join('\n');

        return xml_str;
    },

    pretty_xml_str: function(xml_str) {
        var formatted = '';
        var reg = /(>)(<)(\/*)/g;
        xml = xml.replace(reg, '$1\r\n$2$3');
        var pad = 0;
        jQuery.each(xml.split('\r\n'), function(index, node) {
            var indent = 0;
            if (node.match( /.+<\/\w[^>]*>$/ )) {
                indent = 0;
            } else if (node.match( /^<\/\w/ )) {
                if (pad != 0) {
                    pad -= 1;
                }
            } else if (node.match( /^<\w[^>]*[^\/]>.*$/ )) {
                indent = 1;
            } else {
                indent = 0;
            }

            var padding = '';
            for (var i = 0; i < pad; i++) {
                padding += '  ';
            }

            formatted += padding + node + '\r\n';
            pad += indent;
        });

        return formatted;
    },


    ///////////////////////////////////////////////////////
    // Hint Dictionary related functions
    ///////////////////////////////////////////////////////

    /**
     * Convert a list of anns to hints as tag name dict
     * @param {object} dtd annotation dtd object
     * @param {list} anns a list of annotation objects
     */
    anns2hint_dict: function(dtd, anns) {
        var hint_dict = {};

        for (let i = 0; i < anns.length; i++) {
            const ann = anns[i];
            for (let j = 0; j < ann.tags.length; j++) {
                this.add_tag_to_hint_dict(
                    ann, 
                    ann.tags[j], 
                    hint_dict
                );
            }
        }

        return hint_dict;
    },

    /**
     * Add an annotation to hint
     * 
     * @param {Object} ann annotation object
     * @param {Object} hint_dict hint
     * @returns hint_dict
     */
    add_ann_to_hint_dict: function(ann, hint_dict) {
        for (let i = 0; i < ann.tags.length; i++) {
            this.add_tag_to_hint_dict(
                ann,
                ann.tags[i],
                hint_dict
            );
        }
        return hint_dict;
    },

    /**
     * Add one tag to hint_dict
     * 
     * @param {Object} ann annotation object
     * @param {Object} tag annotated tag
     * @param {Object} hint_dict hints
     * @returns 
     */
    add_tag_to_hint_dict: function(ann, tag, hint_dict) {
        // create this tag if not exists
        if (!hint_dict.hasOwnProperty(tag.tag)) {
            hint_dict[tag.tag] = {
                // text only
                text_dict: {}, 

                // non-consuming dict
                nc_dict: {
                    count: 0,
                    ann_fn_dict: {},
                    _is_shown: false,
                }, 

                // just a list of texts
                texts: []
            }
        }
        // empty text should be removed
        if (!tag.hasOwnProperty('text')) {
            // which means it's a link tag
            // we can do nothing to a link tag now
            return;
        }

        // now get the text and trim it
        var text = tag.text;
        text = text.trim();

        // for empty text, need to further check
        if (text == '') {
            // need to check if is a NC etag
            if (tag.spans == this.NON_CONSUMING_SPANS) {
                // add this nc etag
                if (hint_dict[tag.tag].nc_dict.ann_fn_dict.hasOwnProperty(ann._filename)) {
                    // oh, this is NOT a new file
                    // just increase the count for this concept and file
                    hint_dict[tag.tag].nc_dict.count += 1;
                    hint_dict[tag.tag].nc_dict.ann_fn_dict[ann._filename] += 1
        
                } else {
                    // ok, this is a new file
                    // count +1
                    hint_dict[tag.tag].nc_dict.count += 1;
        
                    // save this ann file name
                    hint_dict[tag.tag].nc_dict.ann_fn_dict[ann._filename] = 1;
                }

                // ok, we have add this file information to the hint dict
                return hint_dict;

            } else {
                // ok, it's just a wrong hint I guess
                return hint_dict;
            }
        }

        // add this text
        if (hint_dict[tag.tag].text_dict.hasOwnProperty(text)) {
            // oh, this is NOT a new text
            // just increase the count
            hint_dict[tag.tag].text_dict[text].count += 1;
            if (hint_dict[tag.tag].text_dict[text].ann_fn_dict.hasOwnProperty(ann._filename)) {
                hint_dict[tag.tag].text_dict[text].ann_fn_dict[ann._filename] += 1;
            } else {
                hint_dict[tag.tag].text_dict[text].ann_fn_dict[ann._filename] = 1;
            }

        } else {
            // ok, this is a new text
            // count +1
            hint_dict[tag.tag].text_dict[text] = {
                count: 1,
                ann_fn_dict: {},
                _is_shown: false
            };

            // save this tag
            hint_dict[tag.tag].texts.push(text);

            // save this ann file name
            hint_dict[tag.tag].text_dict[text].ann_fn_dict[ann._filename] = 1;
        }

        return hint_dict;
    },

    /**
     * Search feasible hints to ranges for highlighting in codemirror
     * Those conflict / overlaped hints would be skiped
     * 
     * @param {object} hints The hints object contains all hint texts
     * @param {object} ann The annotation object which contains text and tags
     * @param {list} focus_tags The focused tags for searching
     */
    search_hints_in_ann: function(hint_dict, ann, focus_tags) {
        if (typeof(focus_tags) == 'undefined') {
            focus_tags = null;
        }
        var is_overlapped = function(a, b) {
            if (a[0] >= b[0] && a[0] < b[1]) {
                return true;
            }
            if (a[1] > b[0] && a[1] <= b[1]) {
                return true;
            }
            // the missing for contains
            if (a[0] <= b[0] && a[1] >= b[1]) {
                return true;
            }
            return false;
        }

        var is_overlapped_in_list = function(loc_x, loc_list) {
            for (let i = 0; i < loc_list.length; i++) {
                const loc = loc_list[i];
                if (is_overlapped(loc_x, loc)) {
                    return true;
                }
            }
            return false;
        }

        // for saving the locations of all marks 
        var loc_list = [];

        // for saving those hints need to be marked
        var hint_list = [];

        // for saving existing hint strs and mapping to tags
        var str_dict = {};

        // first, put existed ann tags in to mark dict
        for (let i = 0; i < ann.tags.length; i++) {
            const tag = ann.tags[i];
            if (!tag.hasOwnProperty('spans')) {
                // which means it's a link tag
                continue;
            }
            // var spans = tag.spans.split(',');
            // for (let j = 0; j < spans.length; j++) {
            //     const span = spans[j];
            //     var loc = this.span2loc(span);
            //     loc_list.push(loc);
            // }
            var _locs = this.spans2locs(tag.spans);
            loc_list = loc_list.concat(_locs);
        }
        console.log('* created loc_list', loc_list);
        
        // check each tag in the hint
        for (const tag_name in hint_dict) {
            if (Object.hasOwnProperty.call(hint_dict, tag_name)) {
                // focus on specifed tag hint
                if (focus_tags == null) {
                    // ok, search all
                } else if (focus_tags.indexOf(tag_name)>=0) {
                    // ok, this tag need to search
                } else {
                    // wow, no need to search this tag
                    continue;
                }

                // check each str in this hint tag
                for (let i = 0; i < hint_dict[tag_name].texts.length; i++) {
                    const str = hint_dict[tag_name].texts[i];
                    // if this str exists, just skip
                    if (str_dict.hasOwnProperty(str)) { 
                        if (str_dict[str].tags.hasOwnProperty(tag_name)) {

                        } else {
                            str_dict[str].tags[tag_name] = 1;
                        }
                        continue; 
                    }

                    // put this str to global dict first
                    str_dict[str] = {
                        tags: {}
                    };
                    str_dict[str].tags[tag_name] = 1;

                    // then find the locs of this str in
                    var locs = this.get_locs(str, ann.text);

                    for (let j = 0; j < locs.length; j++) {
                        const loc = locs[j];
                        
                        // we need to check whether this loc exsits
                        if (is_overlapped_in_list(loc, loc_list)) {
                            // ok, skip this
                        } else {
                            // append this loc to the list
                            loc_list.push(loc);

                            // and add this loc as a new mark
                            hint_list.push({
                                id: 'hint-' + tag_name + '-' + i + '-' + j,
                                tag: tag_name,
                                text: str,
                                spans: this.loc2span(loc)
                            })
                        }
                    }
                }
            }
        }

        return hint_list;
    },

    get_stat_tokens_by_hint_dict: function(hint_dict) {
        var stat = {
            rs: []
        };

        for (const tag_name in hint_dict) {
            if (Object.hasOwnProperty.call(hint_dict, tag_name)) {
                const hint_info = hint_dict[tag_name];
                
                for (const text in hint_info.text_dict) {
                    if (Object.hasOwnProperty.call(hint_info.text_dict, text)) {
                        const text_info = hint_info.text_dict[text];

                        // how many anns/docs contain this text for this tag_name
                        var n_anns = Object.keys(text_info.ann_fn_dict).length;

                        // total count of this text for this tag_name in all anns/docs
                        var n_count = text_info.count;

                        // save this information
                        stat.rs.push({
                            text: text,
                            tag_name: tag_name,
                            n_count: n_count,
                            n_anns: n_anns
                        });
                    }
                }
            }
        }

        return stat;
    },

    ///////////////////////////////////////////////////////
    // Utils
    ///////////////////////////////////////////////////////
    get_locs: function(str, text) {
        // convert str to lower for ignore case?
        try {
            var regex = new RegExp('\\b' + str + '\\b', 'gmi');
        

            var m;
            var locs = [];
            while ((m = regex.exec(text)) !== null) {
                // This is necessary to avoid infinite loops with zero-width matches
                if (m.index === regex.lastIndex) {
                    regex.lastIndex++;
                }
                
                // The result can be accessed through the `m`-variable.
                m.forEach((match, groupIndex) => {
                    locs.push([ m.index, regex.lastIndex]);
                });
            }

            return locs;
        } catch (error) {
            console.log("* couldn't create regex by", str);
            return [];
        }
    },

    get_text_by_spans: function(spans, full_text) {
        var locs = this.spans2locs(spans);
        var text = [];
        for (let i = 0; i < locs.length; i++) {
            const loc = locs[i];
            const _t = full_text.substring(
                loc[0],
                loc[1]
            );
            text.push(_t);
        }

        return text.join('...');
    },

    spans2locs: function(raw_spans) {
        // fix for the special convert
        raw_spans = raw_spans.replaceAll(';', ',');

        // split by comma
        var span_arr = raw_spans.split(',');
        var locs = [];
        for (let i = 0; i < span_arr.length; i++) {
            const span = span_arr[i];
            var loc = this.span2loc(span);

            if (loc == null) {

            } else {
                locs.push(loc);
            }
        }

        return locs;
    },

    span2loc: function(span) {
        var ps = span.split('~');
        var span_pos_0 = parseInt(ps[0]);
        var span_pos_1 = parseInt(ps[1]);

        if (isNaN(span_pos_0)) {
            return null;
        }
        if (isNaN(span_pos_1)) {
            return null;
        }
        return [
            span_pos_0,
            span_pos_1
        ];
    },

    loc2span: function(loc) {
        return loc[0] + '~' + loc[1];
    },

    locs2spans: function(locs) {
        var spans = [];
        for (let i = 0; i < locs.length; i++) {
            const loc = locs[i];
            var span = this.loc2span(loc);
            spans.push(span);
        }
        spans = spans.join(',');
        return spans;
    },

    hash: function(str, seed) {
        if (typeof(seed) == 'undefined') {
            seed = 0;
        }
        let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
        for (let i = 0, ch; i < str.length; i++) {
            ch = str.charCodeAt(i);
            h1 = Math.imul(h1 ^ ch, 2654435761);
            h2 = Math.imul(h2 ^ ch, 1597334677);
        }
        h1 = Math.imul(h1 ^ (h1>>>16), 2246822507) ^ Math.imul(h2 ^ (h2>>>13), 3266489909);
        h2 = Math.imul(h2 ^ (h2>>>16), 2246822507) ^ Math.imul(h1 ^ (h1>>>13), 3266489909);
        return 4294967296 * (2097151 & h2) + (h1>>>0);
    },

    get_next_tag_id: function(ann, tag_def) {
        var n = 0;
        for (let i = 0; i < ann.tags.length; i++) {
            if (ann.tags[i].tag == tag_def.name) {
                // get the id number of this tag
                var _id = parseInt(ann.tags[i].id.replace(tag_def.id_prefix, ''));
                if (_id >= n) {
                    n = _id + 1;
                }
            }
        }
        return tag_def.id_prefix + n;
    },

    get_tag_by_tag_id: function(tag_id, ann) {
        for (let i = 0; i < ann.tags.length; i++) {
            if (ann.tags[i].id == tag_id) {
                return ann.tags[i];
            }                
        }
        return null;
    },

    get_linked_rtags: function(tag_id, ann) {
        var tags = [];
        for (let i = 0; i < ann.tags.length; i++) {
            const tag = ann.tags[i];
            
            // check if this is itself
            if (tag.id == tag_id) {
                // skip this tag_id itself
                continue;
            }

            for (const attr in tag) {
                if (Object.hasOwnProperty.call(tag, attr)) {
                    if (attr == 'id'   || 
                        attr == 'tag'  ||
                        attr == 'text' ||
                        attr == 'spans'
                    ) {
                        // skip those special attrs
                        continue;
                    }
                    const val = tag[attr];
                    if (val == tag_id) {
                        // ok, this a link ... I guess 
                        tags.push(tag);

                        // then, we don't need to check other attr
                        // just go to next tag
                        break;
                    }
                }
            }
        }
        return tags;
    },


};