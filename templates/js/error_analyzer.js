/**
 * Error Analyzer
 * 
 * A toolkit for analyzing the corpus error.
 * The function is based on IAA calculator's output:
 * 
 * When using annotator A as Gold Standard Corpora (GSC),
 * The annotator B can be regarded as a system to be assessed.
 * The IAA between GSC and B, especially the false positive (FP)
 * and false negative (FN) can be analyzed as errors.
 */
var error_analyzer = {
    // default errors definition
    DEFAULT_ERROR_DEF: {
        "Liguistic": [
            "Lexicon",
            "Orthographic",
            "Morphologic",
            "Syntactic",
            "Semantic",
        ], 
        "Contextual": [
            "Section",
            "Certainty",
            "Status",
            "Temporality",
            "Subject",
            "Absence of Context",
            "Exclusion",
        ], 
        "Logic": [
            "Pattern and Rule",
        ], 
        "Annotation": [
            "Missing Annotation",
            "Insufficent Context",
            "Extrapolation of Evidence",
            "Non-defined Concept",
        ],
        "Concept Definition": [
            "Ambiguity",
            "Source Evidence",
            "Change of Status",
        ]
    },

    UNK_ERR_TYPE: 'UNK',
    UNK_ERR_CATE: 'UNK',

    /**
     * Get statistics on the given tags
     * 
     * The err is an object like the following:
     * 
     * {
        // unique id for this tag in this analysis
        "uid": "8x9iju7xs2",
        // id in that document / file
        "id": "AE1",                
        "spans": "82~87",           
        "sentence": "I got faint",
        "sentence_spans": "6~11",  
        "tag": "AE",                
        "text": "faint",            
        "_filename": "12345.txt",
        "_annotator": "B",
        "_judgement": "FP",
        
        // the following are optional based on dtd
        "certainty": "Positive",    
        "comment": "Are you sure?", 

        // the following may be provided by user or web service
        "errors": [
            { "category": "Liguistic", "type": "Morphologic" },
            { "category": "Annotation", "type": "Missing Annotation" },
            { "category": "Concept Definition", "type": "Ambiguity" }, 
        ]
     * }
     * 
     * @param {Object} err_dict a dict of error tags by the uid of error tag
     * @param {Object} dtd annotation schema
     */
    get_err_stat: function(err_dict, dtd) {
        // there are several things we want
        // 1. basic count by concept
        // 2. error type and cate stat

        // stat by dtd
        var stat_by_dtd = {};
        // init the stat by dtd with dtd etags
        for (let i = 0; i < dtd.etags.length; i++) {
            const etag = dtd.etags[i];
            stat_by_dtd[etag.name] = {
                FP: [],
                FN: [],
            };
        }

        // stat by err
        var stat_by_err = {
            // the only type is UNK at present
            'UNK': {
                FP: [],
                FN: []
            }
        };

        // stat by relations
        var stat_by_rel = {
            // column 1: error 
            c_error: { FP: { 'UNK': [] }, FN: { 'UNK': [] } },
            // column 2: error category
            c_category: { 'UNK': { 'UNK': [] }},
            // column 3: error type
            c_type: { 'UNK': {} }
        };

        // check each tag
        for (const uid in err_dict) {
            const err = err_dict[uid];

            // update dtd stat
            stat_by_dtd[err.tag][err._judgement].push(err.uid);
            
            // update the error stat if it has
            if (err.hasOwnProperty('errors')) {
                // ok, this has information
                for (let i = 0; i < err.errors.length; i++) {
                    const err = err.errors[i];
                    if (stat_by_err.hasOwnProperty(err.type)) {
                        // ok, no need to revise stat_by_err
                    } else {
                        // stat_by_err doesn't have this?
                        // just init it with an empty one
                        stat_by_err[err.type] = {
                            FP: [], 
                            FN: []
                        };
                    }
                    stat_by_err[err.type][err._judgement].push(uid);

                    // update the relationship
                    // col 1-2
                    if (!stat_by_rel.c_error[err._judgement].hasOwnProperty(err.category)) {
                        // init it as a list
                        stat_by_rel.c_error[err._judgement][err.category] = {};
                    }
                    stat_by_rel.c_error[err._judgement][err.category].push(uid);

                    // col 2-3
                    if (!stat_by_rel.c_category.hasOwnProperty(err.category)) {
                        // init it as a obj
                        stat_by_rel.c_category[err.category] = {};
                    }
                    if (!stat_by_rel.c_category[err.category].hasOwnProperty(err.type)) {
                        // init it as a list
                        stat_by_rel.c_category[err.category][err.type] = [];
                    }
                    stat_by_rel.c_category[err.category][err.type].push(uid);

                    // col 3-4
                    if (!stat_by_rel.c_type.hasOwnProperty(err.type)) {
                        // init it as a obj
                        stat_by_rel.c_type[err.type] = {};
                    }
                    if (!stat_by_rel.c_type[err.type].hasOwnProperty(err.tag)) {
                        // init it as a list
                        stat_by_rel.c_type[err.type][err.tag] = [];
                    }
                    stat_by_rel.c_type[err.type][err.tag].push(uid);

                }
            } else {
                // oh, this err doesn't have any information
                // just send to UNK
                stat_by_err['UNK'][err._judgement].push(uid);

                // update the relationship
                // col 1
                stat_by_rel.c_error[err._judgement].UNK.push(uid);
                // col 2
                stat_by_rel.c_category.UNK.UNK.push(uid);
                // col 3
                if (!stat_by_rel.c_type.UNK.hasOwnProperty(err.tag)) {
                    // init it as a list
                    stat_by_rel.c_type.UNK[err.tag] = [];
                }
                stat_by_rel.c_type.UNK[err.tag].push(uid);
            }
        }

        // build a ret object
        var ret = {
            by_dtd: stat_by_dtd,
            by_err: stat_by_err,
            by_rel: stat_by_rel
        };

        return ret;
    },

    /**
     * Get the Sankey Diagram Data
     * 
     * @param {Object} stat_by_rel statistics on the relationship
     * @returns sankey data object
     */
    get_sankey_data: function(stat_by_rel) {
        var nodes = {};
        var links = [];

        // build col 1
        var cols = ['c_error', 'c_category', 'c_type'];
        for (let i = 0; i < cols.length; i++) {
            const col = cols[i];
            for (const nLeft in stat_by_rel[col]) {
                for (const nRight in stat_by_rel[col][nLeft]) {
                    var uids = stat_by_rel[col][nLeft][nRight];
    
                    // update the left node
                    if (!nodes.hasOwnProperty(nLeft)) {
                        // add this node
                        nodes[nLeft] = {
                            id: nLeft,
                            name: nLeft,
                            value: 0,
                            layer: i,
                        }
                    }
                    // update node value
                    nodes[nLeft].value += uids.length;
    
                    // update the right node
                    if (!nodes.hasOwnProperty(nRight)) {
                        // add this node
                        nodes[nRight] = {
                            id: nRight,
                            name: nRight,
                            value: 0,
                            layer: i + 1
                        }
                    }
                    // update the right node
                    nodes[nRight].value += uids.length;
                    
                    // update the link
                    links.push({
                        source: nLeft,
                        target: nRight,
                        value: uids.length,
                        column: i
                    });
                }
            }
        }
        
        // convert nodes to node list
        nodes = Object.values(nodes);

        var ret = {
            nodes: nodes,
            links: links,
        };

        return ret;
    }
};