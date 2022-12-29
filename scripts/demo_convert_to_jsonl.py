'''
A demo script for converting the MedTator XML for to 
a JSONL format for PURE NLP based on our medtator toolkit.

As this demo is based on the sentence_kits.py, 
pysbd, spacy, and other related packages needs to be installed before running.

```bash
pip install pysbd spacy 
```

The target JSONL format is defined as follows:
https://github.com/princeton-nlp/PURE#Input-data-format-for-the-entity-model

{
  # document ID (please make sure doc_key can be used to identify a certain document)
  "doc_key": "CNN_ENG_20030306_083604.6",

  # sentences in the document, each sentence is a list of tokens
  "sentences": [
    [...],
    [...],
    ["tens", "of", "thousands", "of", "college", ...],
    ...
  ],

  # entities (boundaries and entity type) in each sentence
  "ner": [
    [...],
    [...],
    [[26, 26, "LOC"], [14, 14, "PER"], ...], #the boundary positions are indexed in the document level
    ...,
  ],

  # relations (two spans and relation type) in each sentence
  "relations": [
    [...],
    [...],
    [[14, 14, 10, 10, "ORG-AFF"], [14, 14, 12, 13, "ORG-AFF"], ...],
    ...
  ]
}

'''

import json
from itertools import combinations
import medtator_kits as mtk
import sentence_kits as stk

# first, let's define the path for the input XML files
# for this demo, we use the path in our sample dataset
# it contains 4 xml files for testing
path = '../sample/ENTITY_RELATION_TASK/ann_xml/Annotator_A/'

# then define the output path for the generated JSONL format file
output_path = '../../dataset.json'

# parse the XML files in the given path.
# it's just the raw XML files with basic conversion
# all annotation files are saved in the rst['anns']
rst = mtk.parse_xmls(path)
print(rst['stat'])

# for the target format, we don't need to use the raw XML files,
# so we convert the the annotation files to a sentence-baed format
# and the parsed result of each annotation file looks like the follwoing
# {
#     "text": "The full text of the file",
#     "sentence_tags": [{
#         "sentence": "this is a sentence.",
#         "sentence_tokens": ["this", "is", "a" "sentence", "."],
#         "spans": [start, end],
#         "entities": {
#             "A1": {
#                 "id": "A1",
#                 "tag": "PRON",
#                 "text": "this",
#                 "token_index": [0, 0], // it's the token index in the sentence
#                 // other properties
#             },
#             "A2": {
#                 "id": "A2",
#                 "tag": "NOUN",
#                 "text": "a sentence",
#                 "token_index": [2, 3], // it's the token index in the sentence
#                 // other properties
#             }
#         },
#         "relations": {
#             "R1": {
#                 "id": "R1",
#                 "tag": "RELP",
#                 "link_EAID": "A1", // this
#                 "link_EBID": "A2", // a sentence
#             }
#         }
#     }]
# }
ann_sents = stk.convert_anns_to_sentags(
    rst['anns'],
    # by default, this tool will skip those sentence without entities,
    # but in this script, we need to keep all the sentences.
    # so, need to set this flag to False
    is_exclude_no_entity_sentence=False,
)
print("* got %s ann_sents" % (len(ann_sents)))

# first, let's prepare a list for the output 
# it will be filled with all the JSONL format annotation files
# we save it on disk at last
output_anns = []

# now need to check each annotation file.
# and use the file name as the doc_key in the output JSONL
# we can combine the original MedTator JSON and the sentence JSON
for ann_idx, (ann, ann_sent) in enumerate(zip(rst['anns'], ann_sents)):
    # for each annotation file, create a JSON object
    print('* converting', ann['_filename'], len(ann_sent['sentence_tags']), 'sent(s)')

    # create an object to hold the output JSONL for this annotation file
    # the format just follows the requirements in the PURE model document
    out_ann = {
        # the filename
        # we just use the annotation file name here
        'doc_key': ann['_filename'],
        # sentences in the document, each sentence is a list of tokens
        "sentences": [],
        # entities (boundaries and entity type) in each sentence
        # for those sentences without entities, just leave []
        "ner": [],
        # relations (two spans and relation type) in each sentence
        # for those sentences without relations, just leave []
        "relations": []
    }

    # create a tag_id-based dictionary for quick search in this annotation.
    # later we can use the tag id to search this tag in the current annotation.
    # it can also be helpful to support cross-sentence relation converting if needed.
    tag_dict = {}
    # unlike other formats, this format needs to use a document-level index,
    # so we need to count the offset of each sentences here
    sent_base_idx = 0
    # to implement the tag_dict and sentence base index counting,
    # we need to walk through the whole annotation file
    for sent_idx, sentag in enumerate(ann_sent['sentence_tags']):
        # check each sentence
        for ent_idx in sentag['entities']:
            # get this entity content by the ent_idx
            ent = sentag['entities'][ent_idx]

            # check each entity in this sentence
            tag_dict[ent['id']] = {
                # first, we need to save this entity
                'ent': ent,
                # second, we need to save the offset of this sentence in document
                # for generating doc-level index for each entity
                'sent_base_idx': sent_base_idx
            }

        # update the sentence base index
        # just move the index to the end of this sentence
        sent_base_idx += len(sentag['sentence_tokens'])


    # for the current annotation file, check each sentence again for all relations
    # unlike other formats, this format needs to use a document-level index for the 
    sent_base_idx = 0
    for sent_idx, sentag in enumerate(ann_sent['sentence_tags']):
        # for each sentence, we need to get three things:
        # 1. the sentence tokens
        sent_tokens = []
        # 2. the entities, and their document-level index and entity type (tag)
        ents = []
        # 3. the relations, 
        rels = []

        # first, get the tokens of this sentence an
        sent_tokens = sentag['sentence_tokens']

        # second, get the entities
        for ent_idx in sentag['entities']:
            # get the entity of orginal format
            ent = sentag['entities'][ent_idx]

            # now we can save this entity in the new format
            ents.append([
                # the doc-level index of the first token
                ent['token_index'][0] + sent_base_idx, 
                # the doc-level index of the last token,
                ent['token_index'][1] + sent_base_idx,
                # the type of the this tag
                ent['tag']
            ])

        # third, get the relations, this is the most complex part.
        # depends on the annotation schema, the number of links is different.
        # for simplicity, each relation should only contains two entities.
        # but sometimes the annotation schema may define relations with multiple entities.
        # therefore, one annotated relation may be converted to many records of two-entity pair.
        # for example, if a relation R is defined as a four-entity relation [Ea, Eb, Ec, Ed],
        # the number of the combination of two-entity pair can be nCr(4,2) = 6
        # i.e., Ea-Eb, Ea-Ec, Ea-Ed, Eb-Ec, Eb-Ed, Ec-Ed
        # So, some combinations may not be reasonable, but need to design it carefully.
        # in this demo script, we just show how to generate all combinations of two-pairs

        for rel_idx in sentag['relations']:
            # get the relation tag
            rel = sentag['relations'][rel_idx]
            # the `rel` is an object containing all the information of a relation tag
            # {
            #     'id': 'Rxx',
            #     'tag': 'RELTYPE',
            #     'entity_type1ID': 'A1',
            #     'entity_type2ID': 'A2',
            #     ... more attributes
            # }

            # first, we need to get all the entities in this relation
            rel_ent_attrs = []
            
            for rel_attr_name in rel:
                # As defined by the MedTator XML format, 
                # the entity attribute defined in a relation should have two attributes.
                # Therefore, for those attribute name ends with `ID`,
                # they are entity attributes and the value is the entity ID.
                if rel_attr_name.endswith('ID'):
                    # ok, this is an entity attribute
                    rel_ent_attrs.append(rel_attr_name)
                else:
                    # we don't need other attributes
                    pass

            # second, we need to generate the combinations
            # this will return a list of combs, for example:
            # a list of ['a', 'b', 'c']'s combs are
            # [('a', 'b'), ('a', 'c'), ('b', 'c')]
            rel_ent_attr_pairs = list(combinations(rel_ent_attrs, 2))

            # now, we can get check each pair
            for attr_pair in rel_ent_attr_pairs:
                # let's get the attr_1 and attr_2 for each element in the pair
                attr_1 = attr_pair[0]
                attr_2 = attr_pair[1]

                # get the values of each attribute
                rel_ent_id_1 = rel[attr_1]
                rel_ent_id_2 = rel[attr_2]

                # to ensure the data quality, we need to check if there is missing or empty
                # first, check if empty. if so, just skip
                # because we cannot get any information without ID
                if rel_ent_id_1 == '' or rel_ent_id_2 == '': continue

                # get these two entities from the tag_dict
                # or get them from sentag['entities'].
                # in case cross sentence relation, 
                # use doc-level tag dict would be safer.
                rel_ent_1 = tag_dict[rel_ent_id_1]['ent']
                rel_ent_2 = tag_dict[rel_ent_id_2]['ent']

                # and also need to get the offset of the sentence of this entity
                sent_base_idx_1 = tag_dict[rel_ent_id_1]['sent_base_idx']
                sent_base_idx_2 = tag_dict[rel_ent_id_2]['sent_base_idx']

                ###################################################
                # customized rules go here
                ###################################################

                # you can implement your own rules of excluding other pairs.
                # for example, you can exclude some pairs by the entity attributes

                ###################################################
                # end of cstomized rules
                ###################################################

                # then, save this record
                rels.append([
                    # the doc-level index of the first token of 1st entity
                    rel_ent_1['token_index'][0] + sent_base_idx_1, 
                    # the doc-level index of the last token of 1st entity
                    rel_ent_1['token_index'][1] + sent_base_idx_1, 
                    # the doc-level index of the first token of 2nd entity
                    rel_ent_2['token_index'][0] + sent_base_idx_2,
                    # the doc-level index of the last token of 2nd entity
                    rel_ent_2['token_index'][1] + sent_base_idx_2,

                    # for this JSONL format, a relation name is needed.
                    # we could use the relation concept name here,
                    # or you can customized other labels for this.
                    rel['tag']
                ])


        # now, we have collected the sentence tokens, entities, and the relations
        # for this annotation file, 
        # add the tokens
        out_ann['sentences'].append(sent_tokens)
        # add the entities
        out_ann['ner'].append(ents)
        # add the relations
        out_ann['relations'].append(rels)

        # at last, we need to update the sentence base index for this loop
        # just move the index to the end of this sentence
        sent_base_idx += len(sentag['sentence_tokens'])

    # ok, this annotation file has been converted to an out_ann
    # it's ready to be saved in the output list
    output_anns.append(out_ann)


print('* writing converted results to %s' % output_path)
# OK, we have converted all annotation files to the JSONL format
# next need to save it into a JSONL format file
with open(output_path, 'w', encoding='utf8') as f:
    # check each output annotation file
    for out_ann in output_anns:
        # each annotation file is one single line of JSON string
        ann_str = json.dumps(out_ann)
        # write this string into the output file
        f.write(ann_str)
        # and a line break
        f.write('\n')


print("* made the JSONL format file: %s" % (
    output_path
))
