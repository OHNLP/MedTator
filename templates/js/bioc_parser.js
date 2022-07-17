/**
 * BioC format annotation file parser
 */
var bioc_parser = {

    NON_CONSUMING_SPANS: '-1~-1',

    anns2xml: function(anns, dtd) {
        // create the root document
        var xmlDoc = document.implementation.createDocument(
            null, 'collection'
        );
        var root = xmlDoc.getElementsByTagName('collection')[0];

        // create an empty source tag
        var elem_source = xmlDoc.createElement('source');
        root.appendChild(elem_source);

        // create a date tag
        var elem_date = xmlDoc.createElement('date');
        elem_date.innerHTML = "" + new Date();
        root.appendChild(elem_date);

        // create an empty key tag
        var elem_key = xmlDoc.createElement('key');
        root.appendChild(elem_key);

        // create document for each ann
        for (let i = 0; i < anns.length; i++) {
            const ann = anns[i];

            // create a document tag for this ann
            var elem_doc = xmlDoc.createElement('document');

            // add filename as id to this document
            var elem_id = xmlDoc.createElement('id');
            elem_id.innerHTML = ann._filename;
            elem_doc.appendChild(elem_id);

            // there is only one passage for this doc
            var elem_passage = xmlDoc.createElement('passage');

            // add the offset 0 to this passage
            var elem_poffset = xmlDoc.createElement('offset');
            elem_poffset.innerHTML = '0';
            elem_passage.appendChild(elem_poffset);

            // add the text to this passage
            var elem_ptext = xmlDoc.createElement('text');
            elem_ptext.appendChild(
                xmlDoc.createTextNode(ann.text)
            );
            elem_passage.appendChild(elem_ptext);

            // add all entity tags to this passage
            for (let j = 0; j < ann.tags.length; j++) {
                const tag = ann.tags[j];
                
                // get the tag def from dtd
                var tag_def = dtd.tag_dict[tag.tag];

                if (tag_def.type == 'etag') {
                    // ok, it is a entity tag
                    // due to the fact of non-continous annoation,
                    // we need to check the spans first
                    var locs = ann_parser.spans2locs(tag.spans);

                    // for most of time, there is only one loc
                    // but sometimes, there are more
                    for (let k = 0; k < locs.length; k++) {
                        const loc = locs[k];

                        // get the attribute for the location element
                        var att_len = loc[1] - loc[0];
                        var att_ofs = loc[0];

                        // each entity tag is an annotation element 
                        var elem_ann = xmlDoc.createElement('annotation');
                        // set the ann elem id 
                        if (locs.length == 1) {
                            // if this is only one loc, just use the id
                            elem_ann.setAttribute('id', tag.id);
                        } else {
                            // otherwise, add suffix
                            elem_ann.setAttribute('id', tag.id + '_' + k);
                        }

                        // create location elements for this ann
                        var elem_location = xmlDoc.createElement('location');
                        elem_location.setAttribute('length', att_len);
                        elem_location.setAttribute('offset', att_ofs);
                        elem_ann.appendChild(elem_location);

                        // set the text content for this annotation
                        var elem_atext = xmlDoc.createElement('text');
                        var atext = ann.text.substring(loc[0], loc[1]);
                        elem_atext.appendChild(
                            xmlDoc.createTextNode(atext)
                        );
                        elem_ann.appendChild(elem_atext);

                        // ok, let's put other elements in this annotation
                        for (const key in tag) {
                            if (Object.hasOwnProperty.call(tag, key)) {
                                const val = tag[key];
                                if (['id','spans','text','tag'].contains(key)) {
                                    // these keys can be skipped
                                    continue;
                                }
                                
                                // for other key, need to create a infon element
                                var elem_infon = xmlDoc.createElement('infon');
                                elem_infon.setAttribute('key', key);
                                elem_infon.innerHTML = val;

                                // ok, add this infon to this annotation
                                elem_ann.appendChild(elem_infon);
                            }
                        }
                        // finally, add this ann to the passage
                        elem_passage.appendChild(elem_ann);
                    }

                } else if (tag_def.type == 'rtag') {
                    // ok, it is a link tag

                    // each link tag is an relation element 
                    var elem_rel = xmlDoc.createElement('relation');
                    // set the id
                    elem_rel.setAttribute('id', tag.id);

                    // let's check each value
                    // ok, let's put other elements in this relation
                    for (const key in tag) {
                        if (Object.hasOwnProperty.call(tag, key)) {
                            const val = tag[key];
                            if (['id','spans','text','tag'].contains(key)) {
                                // these keys can be skipped
                                continue;
                            }
                            
                            // for other key, need to check attr type first
                            var att_def = tag_def.attr_dict[key];

                            if (att_def.vtype == 'idref') {
                                // for idref type, need to create node
                                var elem_node = xmlDoc.createElement('node');
                                // set the refid
                                elem_node.setAttribute('refid', val);
                                // set the role as the attr name
                                elem_node.setAttribute('role', att_def.name);

                                // add this node
                                elem_rel.appendChild(elem_node);

                            } else {
                                // for other types, just create a infon
                                var elem_infon = xmlDoc.createElement('infon');
                                elem_infon.setAttribute('key', key);
                                elem_infon.innerHTML = val;

                                // ok, add this infon to this annotation
                                elem_rel.appendChild(elem_infon);
                            }
                        }
                    }

                    // ok, save this relation
                    // finally, add this relation to the passage
                    elem_passage.appendChild(elem_rel);

                } else {
                    // what???

                }
            }

            // add this passage to the doc
            elem_doc.appendChild(elem_passage);

            // add this doc to the collection
            root.appendChild(elem_doc);
        }

        return xmlDoc;
    },

    xml2str: function(xmlDoc) {
        const serializer = new XMLSerializer();
        var xmlStr = serializer.serializeToString(xmlDoc);

        // fix missing 
        if (xmlStr.startsWith('<?xml')) {
            // nothing, it' OK
        } else {
            xmlStr = '<?xml version="1.0" encoding="UTF-8" ?>\n<!DOCTYPE collection SYSTEM "BioC.dtd">\n' + xmlStr;
        }
        return xmlStr;
    },

    /**
     * Download the BioC format dataset
     * 
     * @param {list} anns the list of ann object
     * @param {object} dtd the dtd schema
     * @param {string} fn the download file name
     */
     download_dataset_bioc: function(anns, dtd, fn) {
        // get the xml doc
        var xmlDoc = this.anns2xml(anns, dtd);

        // get the string for xml
        var xmlStr = this.xml2str(xmlDoc);

        // download
        var blob = new Blob([xmlStr], {type: "text/xml;charset=utf-8"});
        saveAs(blob, fn);

        return xmlStr;
     }
};