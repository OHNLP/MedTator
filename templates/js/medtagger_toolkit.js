/**
 * MedTagger format annotation file parser
 * 
 */
 var medtagger_toolkit = {
     regex: {
        // the pattern of key value for each result
        key_and_value: /(\S+)="([^"]+)"/gm,
    },

    convert_medtagger_files_to_anns: function(txts, anns, dtd) {
        // first of all, make a dict for ann file names
        var ann_dict = {};
        for (let i = 0; i < anns.length; i++) {
            const ann = anns[i];
            ann_dict[ann.fh.name] = ann;
        }

        // then, work on each txt
        var mt_anns = [];

        for (let i = 0; i < txts.length; i++) {
            const txt = txts[i];
            
            // the ann name should be exactly the txt + '.ann'
            var ann_fn = txt.fh.name + '.ann';

            if (!ann_dict.hasOwnProperty(ann_fn)) {
                // what???
                console.log('* not found ann file for', txt.fh.name);
                continue;
            }
            var ann = ann_dict[ann_fn];

            // ok, we found the matched ann!
            var ann_rs = this.parse_ann_content(
                ann
            );

            // to xml ann
            var mt_ann = this.to_medtator_ann(
                txt,
                ann_rs,
                dtd
            );

            mt_anns.push(mt_ann);
        }

        return mt_anns;
    },

    to_medtator_ann: function(file, ann_rs, dtd) {
        // this is an empty medtator ann
        var ann = {
            text: file.text,
            dtd_name: dtd.name,
            tags: [],
            meta: {},

            // other info
            _fh: null,
            _filename: file.fh.name + '.xml',
            _has_saved: true,
            _sentences: [],
            _sentences_text: ''
        };

        for (let i = 0; i < ann_rs.length; i++) {
            const r = ann_rs[i];
        
            var tag = {};
            // each r contains many k-v pairs
            // we need to copy some values
            if (r.hasOwnProperty('text')) {
                tag['text'] = r.text;
            }
            if (r.hasOwnProperty('norm')) {
                tag['tag'] = r.norm;
            }
            if (r.hasOwnProperty('start') &&
                r.hasOwnProperty('end')) {
                tag['spans'] = r.start + '~' + r.end;
            }

            // then we need to check the tag quality
            if (tag.hasOwnProperty('tag') &&
                tag.hasOwnProperty('text')&&
                tag.hasOwnProperty('spans')) {
                // get the tag_def for this tag
                if (!dtd.tag_dict.hasOwnProperty(tag.tag)) {
                    // this is possible that the normed term may not be available
                    console.log('* skip unknown norm @' + i + ':', tag.tag);
                    continue;
                }

                // it should be matched with the dtd
                var tag_def = dtd.tag_dict[tag.tag];

                // now need to add an ID for this tag
                tag.id = ann_parser.get_next_tag_id(
                    ann,
                    tag_def
                )

                // one more step, the MedTagger output won't contain attrs
                // which are defined in the dtd, so we need to set them
                for (let k = 0; k < tag_def.attrs.length; k++) {
                    const att = tag_def.attrs[k];
                    if (tag.hasOwnProperty(att.name)) {
                        // ok, that's what it should be
                    } else {
                        // also ok, that's what it actually is 
                        tag[att.name] = att.default_value;                            
                        console.log('* patched missing '+tag.tag+'.'+att.name+'] to ' + tag.id);
                    }
                }
                ann.tags.push(tag);
            } else {
                console.log('* skip incomplete tag', tag);
            }
            
        }

        return ann;
    },

    /**
     * Parse the ann file
     * 
     * @param {Object} ann the ann 
     */
    parse_ann_content: function(ann) {

        // first, make a ret
        var rs = [];

        // second, split the ann lines
        for (let i = 0; i < ann.lines.length; i++) {
            const ann_line = ann.lines[i];
            var kvs = this.parse_ann_line(ann_line);

            if (kvs == null) {
                // so this line may be empty or no values?
                continue;
            }

            // I guess it works
            rs.push(kvs);
        }

        // no matter what we have at last, just return it
        return rs;
    },

    parse_ann_line: function(ann_line) {
        if (ann_line == '') {
            return null;
        }

        // the parts are seperated by \t sym
        var parts = ann_line.split('\t');

        // r is record or result
        var r = {};

        for (let i = 0; i < parts.length; i++) {
            const p = parts[i];
            var ret = this.get_key_and_value(p);

            if (ret.length < 2) {
                // must be something wrong??
                continue;
            }
            
            // the first value is the key
            // and the second is the value
            r[ret[0]] = ret[1];
        }

        return r;
    },

    get_key_and_value: function(s) {
        let m;
        var ret = [];
        let regex = this.regex.key_and_value;

        while ((m = regex.exec(s)) !== null) {
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
                    // which is the key
                    values.push(match)

                } else if (groupIndex == 2) {
                    // get value 
                    // not matter what is left, save it
                    values.push(match);
                }
            });

            ret = values;
        }

        
        return ret;
    },

 };