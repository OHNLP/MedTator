/**
 * A SpaCy toolkit for format conversion
 */
var spacy_toolkit = {

    download_anns_as_jsonl: function(anns, dtd, fn) {
        // create patterns
        var patterns = this.anns2patterns(anns);

        // get the text
        var str = this.patterns2str(patterns);

        // download
        var blob = new Blob([str], {type: "text/txt;charset=utf-8"});
        saveAs(blob, fn);

        return str;
    },

    anns2patterns: function(anns) {
        // use a dictionary for sorting
        var patterns = {};
        
        // check each ann
        for (let i = 0; i < anns.length; i++) {
            const ann = anns[i];

            // check each tag in this ann
            for (let j = 0; j < ann.tags.length; j++) {
                const tag = ann.tags[j];
                var tag_name = tag.tag;

                if (patterns.hasOwnProperty(tag_name)) {
                    
                } else {
                    patterns[tag_name] = {
                        text_dict: {},
                        pattern_list: []
                    }
                }
                
                // create a pharse pattern

                // but first check the text itself
                if (!tag.hasOwnProperty('text')) {
                    // what?
                    continue;
                }
                var text = tag.text;

                if (text == null) { 
                    // what?
                    continue;
                }

                // remove blank
                text = text.trim();

                if (text == '') {
                    // what??
                    continue;
                }
                
                // change to lower
                text = text.toLocaleLowerCase();

                if (patterns[tag_name].text_dict.hasOwnProperty(text)) {
                    // skip existed text
                    patterns[tag_name].text_dict[text] += 1;
                    continue;
                }

                // create a new pattern
                var p = {
                    label: tag_name.toLocaleUpperCase(),
                    pattern: text,
                    id: tag_name
                };

                // add this as a new pattern
                patterns[tag_name].pattern_list.push(p);
                patterns[tag_name].text_dict[text] = 1;
            }
        }

        // convert the patterns to a list
        var all_patterns = [];
        for (const tag_name in patterns) {
            if (Object.hasOwnProperty.call(patterns, tag_name)) {
                for (let i = 0; i < patterns[tag_name].pattern_list.length; i++) {
                    const p = patterns[tag_name].pattern_list[i];
                    all_patterns.push(p);
                }
            }
        }

        return all_patterns;
    },

    patterns2str: function(patterns) {
        var strs = [];
        for (let i = 0; i < patterns.length; i++) {
            const p = patterns[i];
            var p_str = JSON.stringify(p);
            strs.push(p_str);
        }

        return strs.join('\n');
    }
};