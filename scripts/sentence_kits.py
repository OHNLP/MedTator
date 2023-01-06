'''
Sentence Processing Toolkits

This module is designed for processing the annotation files.
pySBD and spaCy are needed for sentencization and tokenization.

pySBD: https://github.com/nipunsadvilkar/pySBD
spaCy: https://spacy.io/

```bash
pip install pysbd spacy
```
'''

import os
import argparse

import pysbd

# spaCy v3.4
from spacy.lang.en import English
nlp = English()
tokenizer = nlp.tokenizer

# flag
DEBUG = True
def dprint(*args, **kwargs):
    if DEBUG:
        print(*args, **kwargs)
    else:
        pass

def get_sentences(text):
    '''
    Get sentences from a text by pySBD

    The output of this function is a list of TextSpans:

      TextSpan(sent='Yes!\n\n', start=0, end=6)
      TextSpan(sent='1) The first item. \n', start=6, end=26)
      TextSpan(sent='2) The second item. ', start=26, end=46)
      TextSpan(sent='But\n\n', start=46, end=51)

    '''
    seg = pysbd.Segmenter(language="en", clean=False, char_span=True)
    sents = seg.segment(text)
    return sents
    

def is_overlapped(a, b):
    '''
    a helper function for checking whether a tag is overlapped in a sentence
    '''
    if a[0] >= b[0] and a[0] < b[1]:
        return True
    
    if a[1] > b[0] and a[1] <= b[1]:
        return True
    
    # the missing for contains
    if a[0] <= b[0] and a[1] >= b[1]:
        return True
    
    if b[0] <= a[0] and b[1] >= a[1]:
        return True
        
    return False


def find_matched_tags(
    sent_spans, 
    all_tags, 
    matched_tag_dict={},
    flag_include_partial_matched_relation = True,
    flag_include_relation_in_first_sentence_only = True
):
    '''
    Find the tags matched the given sent_spans by spans

    matched_tag_dict is used for excluding relation tags
    '''
    # all matched entities in a dictionary
    # tag id -> ent
    ents = {}
    # all matched relations in a dictionary
    # tag id -> rel
    rels = {}

    # first round, check all node/entities
    for tag in all_tags:
        if 'spans' not in tag: continue
        # which means it is an entity tag
        spans = tag['spans']
        if True in [is_overlapped(sent_spans, span) for span in spans]:
            # if any of spans overlapped, then this tag should be matched
            ents[tag['id']] = tag 

    # second round, check all links
    for tag in all_tags:
        if 'spans' in tag: continue
        # which means it is a relation tag
        # get all ID tags
        ids = []
        for prop_name in tag:
            if prop_name.endswith('ID'):
                # ok, this is an ID attr, save this entity ID
                if tag[prop_name]!= '':
                    # the value can be empty sometimes, so need to exclude
                    ids.append(tag[prop_name])

        # now let's match the ids with the entities in this sentence
        # which means we found one of the entities in this relation
        # shows in the given sentence, then, just save this and check next
        # it's possible that not all of the entities in a sentence can match
        # so need to deal with this case.
        flags_appear_in_sent = [_id in ents for _id in ids]
        if all(flags_appear_in_sent):
            # ok, all entities in this relation are shown in this sentence
            rels[tag['id']] = tag

        elif any(flags_appear_in_sent):
            # which means at least one entity shows in current sentence
            if flag_include_partial_matched_relation:
                # now need to check whether include
                if flag_include_relation_in_first_sentence_only:
                    # if this relation has been included
                    # then in this condition,
                    # we just skip
                    if tag['id'] in matched_tag_dict:
                        # ok, this relation has already been added to other sentences
                        dprint('* skipped relation [%s] as it has been added to sentence [%s]' % (
                            tag['id'],
                            matched_tag_dict[tag['id']]
                        ))
                        
                    else:
                        # good, this relation has NOT been added
                        # now let's just add to this sentence's rel
                        rels[tag['id']] = tag
                else:
                    # OK, as the flag is False
                    # we will just include this relation 
                    # no matter how many times it is added to other sentences
                    rels[tag['id']] = tag
            else:
                # Oh, although this relation is partially matched
                # (one or more entities, but not all)
                # we don't want to include it, just pass
                pass
        else:
            # this condition means that:
            # this relation has NONE entity in current sentence
            # just pass
            pass

    return ents, rels

def update_ents_token_index(sentence_spans, tokens, ents):
    '''
    Update entities' token index in a token list of sentence

    The input tokens is spaCy's token
    '''
    # now, we can get the token index of entities
    sentence_token_spans = []
    for token_index in range(len(tokens)):
        token = tokens[token_index]
        token_spans = [
            sentence_spans[0] + token.idx,
            sentence_spans[0] + token.idx + len(token),
        ]
        sentence_token_spans.append(token_spans)

    # now compare each entity
    for i, ent in enumerate(ents.values()):
        # ent_idxes saves the token index of all relavant tokens
        ent_idxes = []
        ent_spans = ent['spans']
        for token_index, token_spans in enumerate(sentence_token_spans):
            if all([is_overlapped(token_spans, ent_span) for ent_span in ent_spans ]):
                ent_idxes.append(token_index)
        if len(ent_idxes) > 0:
            # it's possible that there is only one token for this ent
            # so just use this one for twice
            ent_token_idx = [
                ent_idxes[0], # the first index
                ent_idxes[-1] # the last index
            ]
        else:
            # ??? how can this happen???
            ent_token_idx = []
        
        # put the token index back to entity
        ents[ent['id']]['token_index'] = ent_token_idx

    # return the updated entities
    return ents


def convert_ann_to_sentag(
    ann, 
    is_exclude_no_entity_sentence = True,
    flag_include_partial_matched_relation = True,
    flag_include_relation_in_first_sentence_only = True
):
    '''
    Convert an ann to a sentence-based tag collection
    '''
    dprint('* mapping tags to sentences for %s' % (
        ann['_filename']
    ))
    # first, create a record
    r = {
        "text": ann['text'],
        "sentence_tags": []
    }

    # get the sentences
    sents = get_sentences(ann['text'])

    # a list for counting matched tags.
    # this can be used for checking which relation tag has been assigned
    matched_tag_dict = {}

    # for each sentence
    for sent_idx, sent in enumerate(sents):
        # get the spans of this sentence in the whole doc
        sentence_spans = [
            sent.start,
            sent.end
        ]

        # get the raw text of the sentence
        sentence = sent.sent

        # get the tokens in this sentence
        tokens = tokenizer(sentence)
        sentence_tokens = list(map(lambda v: v.text, tokens))

        # get all matched tags in this sentence
        ents, rels = find_matched_tags(
            sentence_spans,
            ann['tags'],
            matched_tag_dict,
            flag_include_partial_matched_relation,
            flag_include_relation_in_first_sentence_only
        )

        # add all tag_id of entities
        for tag_id in ents: matched_tag_dict[tag_id] = sent_idx
        # add all tag_id of relations
        for tag_id in rels: matched_tag_dict[tag_id] = sent_idx

        # we can check if any entity found in this sentence
        if is_exclude_no_entity_sentence and len(ents) == 0:
            # OK, no need to save this sentence
            continue

        # get the token index of given entities
        ents = update_ents_token_index(sentence_spans, tokens, ents)

        # ok, let's build the record for this sentence
        st = {
            'sentence': sentence,
            'sentence_tokens': sentence_tokens,
            'sentence_spans': sentence_spans,

            # entities identified by the tags
            # it's very possible that this sentence has no entities
            # so in future we can exclude
            'entities': ents,
            # relations
            'relations': rels,
        }

        r['sentence_tags'].append(st)

    # finally, save this record
    return r


def convert_anns_to_sentags(
    anns, 
    is_exclude_no_entity_sentence = True,
    flag_include_partial_matched_relation = True,
    flag_include_relation_in_first_sentence_only = True
):
    '''
    Convert many anns to sentence tags

    The anns are the JSON format
    '''
    # new format results
    rs = []

    # check each ann
    for ann in anns:
        r = convert_ann_to_sentag(
            ann,
            is_exclude_no_entity_sentence,
            flag_include_partial_matched_relation,
            flag_include_relation_in_first_sentence_only
        )
        rs.append(r)

    return rs


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Sentence Processing Toolkits')
    parser.add_argument('path',
                        help='the path to the folder that contains annotation files')

    # update the args
    args = parser.parse_args()

    # get the files 
    import medtator_kits as mtk
    ret = mtk.parse_xmls(args.path)

    # get sents
    ann_sents = convert_anns_to_sentags(ret['anns'])

    print(ret)