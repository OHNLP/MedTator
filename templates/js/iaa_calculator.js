var iaa_calculator = {
    
    make_ann_by_rst: function(ann_rst, dtd) {
        var ann = JSON.parse(JSON.stringify(ann_rst.ann));

        // clear the ann tags
        ann.tags = [];

        // check each cate
        var cms = ['tp', 'fp', 'fn'];

        for (const tag_name in ann_rst.rst) {
            if (Object.hasOwnProperty.call(ann_rst.rst, tag_name)) {
                const tag_rst = ann_rst.rst[tag_name];

                for (let i = 0; i < cms.length; i++) {
                    const cm = cms[i];
                    
                    for (let j = 0; j < tag_rst[cm].length; j++) {
                        var tag = Object.assign({}, tag_rst[cm][j].tag);
                        var tag_def = dtd.tag_dict[tag.tag];

                        // get a new id for this tag
                        var new_id = ann_parser.get_next_tag_id(ann, tag_def);

                        // now, set this tag and put it into list
                        tag.id = new_id;
                        ann.tags.push(tag);
                    }
                }
            }
        }

        return ann;
    },

    get_default_gs_dict: function(dtd, iaa_dict) {
        // the core of gs is similar to the iaa_dict.ann
        // which is a hashcode based dictionary.
        // and the inner data is similar.
        /*
        {
            hashcode: {
                ann: ann_obj // but the tags are empty,
                rst: {
                    tag_name: {
                        tp: [{tag: tag, from: 'a'}, ...],
                        fp: [],
                        fn: []
                    }
                }
            }
        }

        the length of tp, fp, fn is exactly equal to the iaa_dict
        */
        var gs_dict = {};

        var cnt = 0;
        for (const hashcode in iaa_dict.ann) {
            if (Object.hasOwnProperty.call(iaa_dict.ann, hashcode)) {
                // deep copy a new object
                const ann_rst = JSON.parse(JSON.stringify(iaa_dict.ann[hashcode]));
                cnt += 1;

                // rename the 
                gs_dict[hashcode] = {
                    // copy the ann_a as defult
                    ann: ann_rst.anns[0],
                    rst: {}
                }

                // rename the gs
                var fn_gs = "G_" + this.find_lcs(
                    ann_rst.anns[0]._filename,
                    ann_rst.anns[1]._filename
                ) + '_' + cnt + '.xml';
                
                gs_dict[hashcode].ann._filename = fn_gs;

                // remove the _fh
                delete gs_dict[hashcode].ann._fh;

                // empty the existing tags
                gs_dict[hashcode].ann.tags = [];

                // add one more 
                gs_dict[hashcode].ann._has_star = false;

                for (const tag_name in ann_rst.rst.tag) {
                    if (Object.hasOwnProperty.call(ann_rst.rst.tag, tag_name)) {
                        const tag_rst = ann_rst.rst.tag[tag_name];
                        gs_dict[hashcode].rst[tag_name] = {
                            tp: [],
                            fp: [],
                            fn: []
                        }

                        // fill each in tp
                        for (let i = 0; i < tag_rst.cm.tags.tp.length; i++) {
                            const tags = tag_rst.cm.tags.tp[i];
                            // use ann_a's result
                            gs_dict[hashcode].rst[tag_name].tp.push({
                                tag: tags[0],
                                from: 'A'
                            });
                        }

                        // fill each in fp
                        for (let i = 0; i < tag_rst.cm.tags.fp.length; i++) {
                            const tags = tag_rst.cm.tags.fp[i];
                            // use ann_a's result
                            gs_dict[hashcode].rst[tag_name].fp.push({
                                tag: tags[0],
                                from: 'A'
                            });
                        }
                        
                        // fill each in fn
                        for (let i = 0; i < tag_rst.cm.tags.fn.length; i++) {
                            const tags = tag_rst.cm.tags.fn[i];
                            // use ann_b's result
                            gs_dict[hashcode].rst[tag_name].fn.push({
                                tag: tags[1],
                                from: 'B'
                            });
                        }
                    }
                }
            }
        }

        return gs_dict;
    },

    get_iaa_summary_json: function(iaa_dict, dtd) {
        // there are the following columns in the summary
        // Tag Name, F1, precision, recall, TP, FP, FN
        var js = [];

        // add the overall
        js.push({
            'tag_name': 'Overall',
            'F1': iaa_dict.all.f1.toFixed(4),
            'precision': iaa_dict.all.precision.toFixed(4),
            'recall': iaa_dict.all.recall.toFixed(4),
            'TP': iaa_dict.all.cm.tp,
            'FP': iaa_dict.all.cm.fp,
            'FN': iaa_dict.all.cm.fn,
        });

        // now, check each etag
        for (let i = 0; i < dtd.etags.length; i++) {
            const etag_name = dtd.etags[i].name;
            
            // add this tag to the summary
            js.push({
                'tag_name': etag_name,
                'F1': iaa_dict.tag[etag_name].f1.toFixed(4),
                'precision': iaa_dict.tag[etag_name].precision.toFixed(4),
                'recall': iaa_dict.tag[etag_name].recall.toFixed(4),
                'TP': iaa_dict.tag[etag_name].cm.tp,
                'FP': iaa_dict.tag[etag_name].cm.fp,
                'FN': iaa_dict.tag[etag_name].cm.fn,
            });
        }

        return js;
    },

    /**
     * Evaluate the IAA based on given schema and 
     * two list of annotations from two annotators
     * 
     * @param {Object} dtd the annotation schema
     * @param {Object} anns_a the annotations by A
     * @param {Object} anns_b the annotations by B
     * @param {string} match_mode overlap or exact match
     * @param {float} overlap_ratio overlap ratio
     * @returns Object of IAA result
     */
    evaluate_anns_on_dtd: function(
        dtd, 
        anns_a, 
        anns_b, 
        match_mode, 
        overlap_ratio
    ) {
        if (typeof(match_mode) == 'undefined') {
            match_mode = 'overlap';
        }
        if (typeof(overlap_ratio) == 'undefined') {
            overlap_ratio = 0.01;
        }
        /* we will build a dictionary for this task
        {
            ann: {
                text_hash: {
                    anns: [ann_a, ann_b],
                    rst: {
                        tag_name: result
                    }
                },
                ...
            },
            all: {pre, rec, f1, cm},
            tag: {
                tag_a: {pre, rec, f1, cm},
            }
        },
        */
        var iaa_dict = {
            ann: {}, // for the file
            all: {},
            tag: {},
            stat: {
                duplicates: [],
                unmatched: [],
                matched_hashcodes: []
            },
        };

        // this is just for checking dupliated ann
        var ann_dict = {};
        
        // first, let's check all anns_a
        for (let i = 0; i < anns_a.length; i++) {
            const ann_a = anns_a[i];
            var hashcode = this.hash(ann_a.text);

            if (ann_dict.hasOwnProperty(hashcode)) {
                // what??? duplicated text in anns_a?
                console.log('* found duplicated ann a', ann_a);
                iaa_dict.stat.duplicates.push({
                    ann: ann_a,
                    from: 'a'
                });
                continue;
            }

            // ok, let's create a new item here
            ann_dict[hashcode] = [{
                ann: ann_a,
                from: 'a'
            }];
        }

        // second, let's check all anns_b
        for (let i = 0; i < anns_b.length; i++) {
            const ann_b = anns_b[i];
            var hashcode = this.hash(ann_b.text);

            if (ann_dict.hasOwnProperty(hashcode)) {
                if (ann_dict[hashcode].length > 1) {
                    // this is a dupliated ann
                    iaa_dict.stat.duplicates.push({
                        ann: ann_b,
                        from: 'b'
                    });
                    console.log('* found duplicated ann b', ann_b);

                    continue;
                }
            } else {
                // which means this ann has no ann in a
                ann_dict[hashcode] = [{
                    ann: ann_b,
                    from: 'b'
                }];
                iaa_dict.stat.unmatched.push({
                    ann: ann_b,
                    from: 'b'
                });
                console.log('* found unmatched ann b', ann_b);
                continue;
            }
            
            // OK, this ann_b could be matched with ann_a
            var ann_a = ann_dict[hashcode][0].ann;
            iaa_dict.ann[hashcode] = {
                anns: [
                    ann_a,
                    ann_b
                ],
                rst: {},
            };

            // save the hashcode
            iaa_dict.stat.matched_hashcodes.push(hashcode);
            
            // let's save this ann_b
            ann_dict[hashcode].push({ 
                ann: ann_b,
                from: 'b'
            });

            // now, time to evaluate
            var rst = this.evaluate_ann_on_dtd(
                dtd,
                ann_a,
                ann_b,
                match_mode,
                overlap_ratio
            );

            // save this result
            iaa_dict.ann[hashcode].rst = rst;
        }

        // third, check if there is any unmatched from ann a
        for (const hashcode in ann_dict) {
            if (Object.hasOwnProperty.call(ann_dict, hashcode)) {
                if (ann_dict[hashcode].length == 1 &&
                    ann_dict[hashcode][0].from == 'a') {
                    // which means ... this ann is not used for matching
                    iaa_dict.stat.unmatched.push(ann_dict[hashcode][0]);

                    console.log('* found unmatched ann a', ann_dict[hashcode][0].ann);
                }
            }
        }

        // finally, calculate the result at all and tag levels
        var cm_all = { tp: 0, fp: 0, fn: 0 };
        for (let i = 0; i < dtd.etags.length; i++) {
            const tag_def = dtd.etags[i];
            var cm_tag = { tp: 0, fp: 0, fn: 0 };
            
            for (const hashcode in iaa_dict.ann) {
                if (Object.hasOwnProperty.call(iaa_dict.ann, hashcode)) {
                    const iaa = iaa_dict.ann[hashcode];
                    // add the result of this tag
                    cm_tag.tp += iaa.rst.tag[tag_def.name].cm.tp;
                    cm_tag.fp += iaa.rst.tag[tag_def.name].cm.fp;
                    cm_tag.fn += iaa.rst.tag[tag_def.name].cm.fn;
                }
            }
            // get the tag level result
            var tag_result = this.calc_p_r_f1(cm_tag);
            iaa_dict.tag[tag_def.name] = tag_result;

            // add the tag level to all
            cm_all.tp += cm_tag.tp;
            cm_all.fp += cm_tag.fp;
            cm_all.fn += cm_tag.fn;
        }
        // get the all level result
        var all_result = this.calc_p_r_f1(cm_all);
        iaa_dict.all = all_result;

        return iaa_dict;
    },

    /**
     * Evaluate the IAA based on given schema and 
     * two annotation from two annotators
     * 
     * @param {Object} dtd the annotation schema
     * @param {Object} ann_a an annotation by A
     * @param {Object} ann_b an annotation by B
     * @param {string} match_mode overlap or exact match
     * @param {float} overlap_ratio overlap ratio
     * @returns Object of IAA result
     */
    evaluate_ann_on_dtd: function(dtd, ann_a, ann_b, match_mode, overlap_ratio) {
        if (typeof(match_mode)=='undefined') {
            match_mode = 'overlap';
        }
        if (typeof(overlap_ratio) == 'undefined') {
            overlap_ratio = 0.01;
        }

        // check the text first
        if (ann_a.text != ann_b.text) {
            throw { 
                name: 'Different texts', 
                message: 'The texts are different in given annotations.'
            };
        }

        // check each etag
        var result_ann = {
            all: {},
            tag: {}
        }
        var cm_ann = { tp: 0, fp: 0, fn: 0 };
        for (let i = 0; i < dtd.etags.length; i++) {
            const tag_def = dtd.etags[i];
            var r = this.evaluate_ann_on_tag(tag_def, ann_a, ann_b, match_mode, overlap_ratio);
            result_ann.tag[tag_def.name] = r;

            // add the result of this tag
            cm_ann.tp += r.cm.tp;
            cm_ann.fp += r.cm.fp;
            cm_ann.fn += r.cm.fn;

        }
        var all_result = this.calc_p_r_f1(cm_ann);

        result_ann.all = all_result;

        return result_ann;
    },

    evaluate_ann_on_tag: function(tag_def, ann_a, ann_b, match_mode, overlap_ratio) {
        if (typeof(match_mode)=='undefined') {
            match_mode = 'overlap';
        }
        if (typeof(overlap_ratio) == 'undefined') {
            overlap_ratio = 0.01;
        }

        // check the text first
        if (ann_a.text != ann_b.text) {
            throw { 
                name: 'Different texts', 
                message: 'The texts are different in given annotations.'
            };
        }

        // get all tags of this tag_def
        var tag_list_a = this.get_tag_list_by_tag(tag_def, ann_a);
        var tag_list_b = this.get_tag_list_by_tag(tag_def, ann_b);

        var cm = this.calc_matching(tag_list_a, tag_list_b, match_mode, overlap_ratio);
        var result = this.calc_p_r_f1(cm);

        return result;
    },

    calc_matching: function(tag_list_a, tag_list_b, match_mode, overlap_ratio) {
        if (typeof(match_mode)=='undefined') {
            match_mode = 'overlap';
        }
        if (typeof(overlap_ratio) == 'undefined') {
            overlap_ratio = 0.01;
        }
        var cm = {
            tp: 0,
            fp: 0,
            fn: 0,
            
            // save the details
            tags: {
                tp: [],
                fp: [],
                fn: []
            }
        };

        // this dictionary is for generating the list for FN list
        var tag_dict_b = {};
        for (let i = 0; i < tag_list_b.length; i++) {
            const tag = Object.assign({}, tag_list_b[i]);
            tag_dict_b[tag.spans] = tag;
        }

        for (let i = 0; i < tag_list_a.length; i++) {
            var tag_a = tag_list_a[i];
            
            var is_match = this.is_tag_in_list(
                tag_a, 
                tag_list_b, 
                match_mode,
                overlap_ratio
            );

            console.log('* a', tag_a.spans, is_match.is_in, 'b', is_match.tag_b);

            if (is_match.is_in) {
                cm.tp += 1;
                cm.tags.tp.push([tag_a, is_match.tag_b]);

                // remove this tag_b from the dict
                delete tag_dict_b[is_match.tag_b.spans];

            } else {
                cm.fp += 1;
                cm.tags.fp.push([
                    tag_a, 
                    // usually, the tag_b is null,
                    // but sometimes it is not
                    is_match.tag_b
                ]);

                // in some cases, it's not match is due to low overlap ratio
                // we need to remove this tag_b as well.
                // but we may also want to keep both?
                // if (is_match.tag_b != null) {
                //     delete tag_dict_b[is_match.tag_b.spans];
                // }
            }
        }

        cm.fn = tag_list_b.length - cm.tp;
        cm.tags.fn = Object.values(tag_dict_b).map(tag => [null, tag]);

        return cm;
    },

    is_tag_in_list: function(tag, tag_list, match_mode, overlap_ratio) {
        if (typeof(match_mode)=='undefined') {
            match_mode = 'overlap';
        }
        if (typeof(overlap_ratio) == 'undefined') {
            overlap_ratio = 0.01;
        }
        var spans = tag.spans;
        var loc_a = this.spans2loc(spans);

        // potential b
        var p_tag_b = null;

        for (let i = 0; i < tag_list.length; i++) {
            const tag_b = tag_list[i];
            var spans_b = tag_b.spans;

            if (match_mode == 'overlap') {
                // for overlap mode, check ranges of two spans
                var loc_b = this.spans2loc(spans_b);
                var is_olpd = this.is_overlapped(
                    loc_a, loc_b, 
                    overlap_ratio
                );
                if (is_olpd[0]) {
                    return { 
                        is_in: true,
                        tag_b: tag_b
                    };
                }
                // in some cases, the overlapped ratio is low
                // but still match, we need to check this case
                if (is_olpd[1] > 0) {
                    p_tag_b = tag_b;
                }
                
            } else if (match_mode == 'exact') {

                if (spans == spans_b) {
                    return {
                        is_in: true,
                        tag_b: tag_b
                    };
                }
            }
        }

        return {
            is_in: false,
            tag_b: p_tag_b
        };
    },

    is_overlapped: function(loc_a, loc_b, overlap_ratio) {
        if (typeof(overlap_ratio)=='undefined') {
            overlap_ratio = 0.01;
        }
        
        var s_a = new Set(new Array(loc_a[1] - loc_a[0] + 1).fill(loc_a[0]).map((e,i)=>e+i));
        var s_b = new Set(new Array(loc_b[1] - loc_b[0] + 1).fill(loc_b[0]).map((e,i)=>e+i));

        var s_inter = this.set_intersection(s_a, s_b);
        var s_union = this.set_union(s_a, s_b);
        var r = s_inter.size / s_union.size;

        // console.log('* is overlapped', loc_a, '', loc_b, 'i:', s_inter.size, 'u:', s_union.size, 'r:', r);

        if (r >= overlap_ratio) {
            return [true, r];
        } else {
            return [false, r]
        }
    },

    spans2loc: function(spans) {
        var vs = spans.split('~');
        return [
            parseInt(vs[0]), 
            parseInt(vs[1])
        ];
    },

    calc_p_r_f1: function(cm) {
        var precision = this.calc_precision(cm.tp, cm.fp);
        var recall = this.calc_recall(cm.tp, cm.fn);
        var f1 = this.calc_f1_by_pr(precision, recall);

        return {
            precision: precision,
            recall: recall,
            f1: f1,
            cm: cm
        }
    },

    calc_precision: function(tp, fp) {
        return tp / (tp + fp);
    },

    calc_recall: function(tp, fn) {
        return tp / (tp + fn);
    },

    calc_f1: function(tp, fp, fn) {
        var precision = this.calc_precision(tp, fp);
        var recall = this.calc_recall(tp, fn);
        return 2 * precision * recall / (precision + recall);
    },

    calc_f1_by_pr: function(precision, recall) {
        return 2 * precision * recall / (precision + recall);
    },

    get_tag_list_by_tag: function(tag_def, ann) {
        var tag_dict = {};
        for (let i = 0; i < ann.tags.length; i++) {
            const tag = ann.tags[i];
            if (tag.tag == tag_def.name) {
                tag_dict[tag.spans] = tag;
            }
        }

        // conver the dictionary to list
        var tag_list = Object.values(tag_dict);
        return tag_list;
    },

    hash: function(str, seed = 0) {
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

    set_union: function(setA, setB) {
        let _union = new Set(setA)
        for (let elem of setB) {
            _union.add(elem)
        }
        return _union
    },
    
    set_intersection: function(setA, setB) {
        let _intersection = new Set()
        for (let elem of setB) {
            if (setA.has(elem)) {
                _intersection.add(elem)
            }
        }
        return _intersection
    },

    /**
     * Find the longest common substring
     * @param {string} str1 a string
     * @param {string} str2 another string
     * @returns longest common substring
     */
    find_lcs: function(str1, str2) {
        let m = new Array(str1.length+1).fill(0).map(function() {
            return new Array(str2.length+1).fill(0);
        });
        let max = 0;
        let index = null;
        for (let i = 0; i < str1.length; i++) {
            
            for (let j = 0; j < str2.length; j++) {
                
                if(str1.charAt(i) === str2.charAt(j)){
                    if(i>0 && j>0 && m[i-1][j-1]>0) {
                        m[i][j] = 1 + m[i-1][j-1];
                    } else{
                        m[i][j] = 1;
                    }
                    
                    if(max < m[i][j]){
                        max = m[i][j];
                        index = i;
                    }
                } else {
                    
                }
            }
        }

        return str1.substr(index-max + 1, max)
    },
    
};