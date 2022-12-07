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
     * Convert an annotation schema file to a brat collection data
     * 
     * The sample collData is like the following:
     * 
     * var collData = {
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
     */
    make_collection_data_by_dtd: function(dtd) {
        var collData = {
            // all the entities
            entity_types: [],

            // all the relations
            relation_types: []
        };

        // first, convert all entities
        for (let i = 0; i < dtd.etags.length; i++) {
            const tag = dtd.etags[i];
            collData.entity_types.push({
                type: tag.name,
                labels : [tag.name],
                bgColor: tag.style.color,
                borderColor: 'darken'
            });
        }

        // second, convert all relations
        for (let i = 0; i < dtd.rtags.length; i++) {
            const tag = dtd.rtags[i];
            let rel_type = {
                type: tag.name,
                labels : [tag.name],
                color: tag.style.color,
                args: []
            };
            // put all idref as args' role
            for (let j = 0; j < tag.attrs.length; j++) {
                const attr = tag.attrs[j];
                if (attr.vtype == 'idref') {
                    // just use the attribute name as the role
                    rel_type.args.push({
                        role: attr.name
                    });
                }
            }
            // then save this rel_type
            collData.relation_types.push(rel_type);
        }

        return collData;
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