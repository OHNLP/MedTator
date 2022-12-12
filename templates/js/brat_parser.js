/**
 * brat standoff format annotation file parser
 * 
 * The format details can be found at:
 * http://brat.nlplab.org/standoff.html
 * 
 * At present, only two types of annotation are supported:
 * 
 * - T: text-bound annotation
 * - R: relation
 * - A: the attribure for annotations
 * 
 * We are using v1.3 which supports discontinuous text-bound annotations, 
 * where the annotation involves more than one continuous span of characters.
 */
var brat_parser = {

    /**
     * Parse the brat ann format
     * 
     * @param {string} ann_text the text content of a given ann
     * @returns document_data object
     */
    parse_ann: function(ann_text) {
        var doc_data = {
            text: '',
            entities: [],
            relations: [],
            attributes: [],
            events: [],
            triggers: []
        };

        let lines = ann_text.split('\n');
        for (let i = 0; i < lines.length; i++) {
            var line = lines[i];
            line = line.trim();

            if (line == '') {
                // it's empty
                continue;
            }
            
            if (line.startsWith('#')) {
                // it's a note
                continue;
            }

            // the first letter must be the line code
            let annotation_type_id = line[0];
            
            if (annotation_type_id == 'T') {
                var r = this._parse_ann_line_type_text(line);
                doc_data.entities.push(r);
            }
        }

        return doc_data;
    },

    _parse_ann_line_type_text: function(line) {
        var ps = line.split('\t');

        // first must be the ID
        var id = ps[0];

        // third must be the token
        var token = ps[2];
        
        // now parse the type and span
        var first_space_idx = ps[1].indexOf(' ');

        // the type is the first char to first space
        var type = ps[1].substring(0, first_space_idx);

        // the rest are spans
        var spans_txt = ps[1].substring(first_space_idx + 1, );

        // for brat v1.3 and later, it can be a multi-part text
        var spans_ps = spans_txt.split(';');

        var locs = [];
        for (let i = 0; i < spans_ps.length; i++) {
            const spans_p = spans_ps[i];
            var sps = spans_p.split(' ');
            
            var a = parseInt(sps[0]);
            var b = parseInt(sps[1]);

            locs.push([a, b]);
        }

        return [
            id,
            type,
            locs,
            token, // which is not required, but I just leave it here
        ]
    },

    // for managing colors
    colors: [
        "#a6cee3",
        "#1f78b4",
        "#b2df8a",
        "#33a02c",
        "#fb9a99",
        "#e31a1c",
        "#fdbf6f",
        "#ff7f00",
        "#cab2d6",
        "#6a3d9a",
        "#ffff99",
        "#b15928",
        "#8dd3c7",
        "#ffffb3",
        "#bebada",
        "#fb8072",
        "#80b1d3",
        "#fdb462",
        "#b3de69",
        "#fccde5",
        "#d9d9d9",
        "#bc80bd",
        "#ccebc5",
        "#ffed6f",
    ],
    // for holding temp color info
    color_mapping: {},

    reset_color_mapping: function() {
        this.color_mapping = {};
    },

    get_color: function(name) {
        if (this.color_mapping.hasOwnProperty(name)) {
            // good, we already have this color
        } else {
            // need to get a new color
            var n_assigned = Object.keys(this.color_mapping).length;
            // need to check whether is available color
            if (n_assigned < this.colors.length) {
                // yes! there is available color
                // assign an pre-defined color
                this.color_mapping[name] = this.colors[n_assigned];
            } else {
                // no ... just generate a random color
                // but we prefer a lighter, but not too bright
                var clr = '#' + Math.floor(Math.random()*8388608 + 4388607).toString(16);

                this.color_mapping[name] = clr;
            }
        }
        return this.color_mapping[name];
    },

    /**
     * Convert an annotation data file to a brat format string
     * 
     * @param {object} ann an annotation object from MedTator
     * @param {object} dtd the dtd schema
     */
    ann2brat: function(ann, dtd) {
        // the global count for 
        var cnt = {
            // the text annotation
            T: 0,
            // the relation annotation
            R: 0,
            // the attribute
            A: 0
        };
        // we need to record the mapping from tag.id to brat ID
        var id_mapping = {}

        // hold all records
        // each recrod contains one row of the format required by brat
        var rs = [];
        for (let i = 0; i < ann.tags.length; i++) {
            // for each tag, there may be more than one record
            // the first record is the tag itself
            const tag = ann.tags[i];

            // ok, let's output this tag
            // first of all, create a new ID as the first column
            var new_ID = null;
            if (dtd.tag_dict[tag.tag].type == 'etag') {
                cnt.T++;
                new_ID = 'T'+cnt.T;

            } else if (dtd.tag_dict[tag.tag].type == 'rtag') {
                cnt.R++;
                new_ID = 'R'+cnt.R;
            }
            // update the mapping
            id_mapping[tag.id] = new_ID;

            // now, put the text for the second column if etag

            // now, put the attributes for more rows
        }

        return rs;
    },

    /**
     * Convert the MedTagger output to brat format
     * 
     * @param {string} text the text content
     * @param {list} ann_rs a list of k-v pairs of MedTagger format
     * @returns {object} {col_data: col_data, doc_data: doc_data}
     */
    medtagger2brat: function(text, ann_rs, flag_attrs) {
        if (typeof(flag_attrs)=='undefined') {
            flag_attrs = {
                certainty: true,
                status: true
            }
        }
        var col_data = {
            // all the entities
            entity_types: [],

            // all attributes for entities
            entity_attribute_types: []
        };

        if (flag_attrs.certainty) {
            col_data.entity_attribute_types.push({
                type: 'Certainty',
                values: {
                    'Positive': {
                        glyph: '➕',
                        glyphColor: 'red',
                    },
                    'Negated': {
                        glyph: '➖',
                        glyphColor: 'green',
                    },
                    'Hypothetical': {
                        glyph: '❓',
                        glyphColor: 'orange',
                    },
                    'Possible': {
                        glyph: '%',
                        glyphColor: 'yellow'
                    }
                }
            });
        }

        if (flag_attrs.status) {
            col_data.entity_attribute_types.push({
                type: 'Status',
                values: {
                    'Present': {
                        glyph: 'P',
                    },
                    'HistoryOf': {
                        glyph: 'H'
                    }
                }
            });
        }

        var doc_data = {
            text: text,

            // all entities
            entities: [],

            // all attributes
            attributes: []
        };

        // for creating new entity
        // we need to track all the 
        var norm_dict = {};

        // prepare the document data
        // MedTagger only contains the entities
        for (let i = 0; i < ann_rs.length; i++) {
            const r = ann_rs[i];

            // update the collection
            if (!norm_dict.hasOwnProperty(r.norm)) {                
                // get a color for this entity
                var bgColor = this.get_color(r.norm);

                // create a new item for collection
                var ent_def = {
                    type: r.norm,
                    labels: [ r.norm ],
                    bgColor: bgColor,
                    borderColor: 'darken'
                }

                // save to collection
                col_data.entity_types.push(ent_def);

                // save to dict
                norm_dict[r.norm] = ent_def;
            }
            
            let entity_id = 'E' + i;

            // update the document
            doc_data.entities.push([
                // 1. id just use the sequence number
                entity_id,
                // 2. use norm as the tag name 
                r.norm,
                // 3. locs are the MedTagger offset
                [ [
                    parseInt(r.start),
                    parseInt(r.end),
                ] ]
            ]);

            // update attributes
            // update the certainty
            if (flag_attrs.certainty) {
                doc_data.attributes.push([
                    'A'+doc_data.attributes.length, 
                    'Certainty', 
                    entity_id, 
                    r.certainty,
                ]);
            }

            // update the status
            if (flag_attrs.status) {
                doc_data.attributes.push([
                    'A'+doc_data.attributes.length, 
                    'Status', 
                    entity_id, 
                    r.status,
                ]);
            }
        }

        return {
            col_data: col_data,
            doc_data: doc_data
        }
    },

    /**
     * Convert an annotation schema file to a brat collection data
     * 
     * The sample col_data is like the following:
     * 
     * var col_data = {
          entity_types: [ {
            type   : 'Person',
            // The labels are used when displaying the annotion, in this case
            // we also provide a short-hand "Per" for cases where
            // abbreviations are preferable 
            labels : ['Person', 'Per'],

            // Blue is a nice colour for a person?
            bgColor: '#7fa2ff',

            // Use a slightly darker version of the bgColor for the border
            borderColor: 'darken'
          }],
          relation_types: [{

          }]
     * };
     * 
     * The sample is from: https://brat.nlplab.org/embed.html
     * @param {object} dtd an annotation object from MedTator
     * @param {string} relation_creation_mode 'all_combos', 'first_others' (default)
     */
    make_collection_data_by_dtd: function(dtd, relation_creation_mode) {
        if (typeof(relation_creation_mode) == 'undefined') {
            relation_creation_mode = 'first_others';
        }
        var col_data = {
            // all the entities
            entity_types: [],

            // all the relations
            relation_types: []
        };

        // first, convert all entities
        for (let i = 0; i < dtd.etags.length; i++) {
            const tag = dtd.etags[i];
            col_data.entity_types.push({
                type: tag.name,
                labels : [tag.name],
                bgColor: tag.style.color,
                borderColor: 'darken'
            });
        }

        // second, convert all relations
        // due the complixity of the schema, we will convert all combos
        for (let i = 0; i < dtd.rtags.length; i++) {
            const tag = dtd.rtags[i];

            // depends on which mode
            if (relation_creation_mode == 'all_combos') {

            } else if (relation_creation_mode == 'first_others') {

                // find the first attr
                for (let j = 0; j < tag.attrs.length; j++) {
                    const attr_j = tag.attrs[j];
                    if (attr_j.vtype == 'idref') {
                        // just use the attribute name as the role
                        
                        // ok, find others from next
                        for (let k = j+1; k < tag.attrs.length; k++) {
                            const attr_k = tag.attrs[k];
                            if (attr_k.vtype == 'idref') {
                                let rel_type = {
                                    // create a subtype for this relation
                                    type: tag.name + '.' + attr_j.name + '-' + attr_j.name,
                                    // the label should be the relation name
                                    labels : [tag.name],
                                    color: tag.style.color,
                                    // the arch is from j to k
                                    args: [
                                        { role: attr_j.name },
                                        { role: attr_k.name }
                                    ]
                                };
                                // save this relation
                                col_data.relation_types.push(rel_type);
                            }
                        }
                        // ok, all first - others are found
                        break;
                    }
                    // if this attr is not idref, just check next one
                    continue;
                }
            }
        }

        return col_data;
    },


    /**
     * Convert an annotation object to a brat document data for brat vis
     * 
     * For most of time, you can use this directly
     * 
     * @param {object} ann the annotation data object containing text and tags
     * @param {object} dtd the annotation schema object
     */
    make_document_data_by_ann: function(ann, dtd) {
        return this.make_document_data
    },

    /**
     * Converting a text and related annotated tags to brat document data for vis
     * 
     * @param {string} text the text string containing the annotated tags
     * @param {list} tags a list of annotated tags, including etags and rtags
     * @param {object} dtd the annotation schema object
     * @returns brat document data object for vis
     */
     make_document_data: function(text, tags, dtd) {
        var doc_data = {
            // text it self
            text: text,
            
            // all entities
            entities: [],

            // all relations
            relations: []

            // no triggers and events
        };

        // create a dict for accessing etags later
        let etag_dict = {};

        // first check all entities
        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i];

            if (dtd.tag_dict[tag.tag].type != 'etag') {
                // skip relation in the first round
                continue;
            }

            // ok, save this etag
            etag_dict[tag.id] = tag;
            
            // get locs
            let locs = ann_parser.spans2locs(tag.spans);

            // put this tag into entities
            doc_data.entities.push([
                // 1. id
                tag.id,
                // 2. tag name
                tag.tag,
                // 3. locs
                locs
            ]);
        }

        // second, check all relations
        for (let i = 0; i < tags.length; i++) {
            const tag = tags[i];

            // get the tag defination
            let tag_def = dtd.tag_dict[tag.tag];
            if (tag_def.type != 'rtag') {
                // skip entity in the second round
                continue;
            }

            let arcs = [];
            // find the arcs in this relationship
            for (const attr_name in tag) {
                if (!tag_def.attr_dict.hasOwnProperty(attr_name)) {
                    // which means this attr_name is just id or tag or other
                    continue;
                }
                // find the attr def
                let attr_def = tag_def.attr_dict[attr_name];
                // let's see what's this attr?
                if (attr_def.vtype != 'idref') {
                    // this is just a text or other type
                    continue;
                }
                // then let's put this attr to arcs
                arcs.push([
                    // the attr name is used as the role in brat
                    attr_name,
                    // the attr value is the entity id
                    tag[attr_name]
                ]);
            }

            // create a new relation obj
            let rel = [
                // 1. id
                tag.id,
                // 2. type, which is the tag name
                tag.tag,
                // 3. two entities
                arcs
            ];

            // ok, save this relation
            doc_data.relations.push(rel);
        }

        return doc_data;
    }
};