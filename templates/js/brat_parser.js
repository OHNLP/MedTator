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
     * Convert an annotation file to a brat format string
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
    }
};