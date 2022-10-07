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


def find_matched_tags(sent_spans, tags):
    '''
    Find the tags matched the given sent_spans by spans
    '''
    # all matched entities
    ents = []
    # all IDs of the matched entities
    ent_ids = []
    # all matched relations
    rels = []

    # first round, check all node/entities
    for tag in tags:
        if 'spans' in tag:
            # which means it is an entity tag
            spans = tag['spans']
            if True in [is_overlapped(sent_spans, span) for span in spans]:
                # if any of spans overlapped, then this tag should be matched
                ents.append(tag)
                ent_ids.append(tag['id'])

    # second round, check all links
    for tag in tags:
        if 'spans' not in tag:
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
            # TODO it's possible that not all of the entities in a sentence can match
            # so need to deal with this case in future
            if all([_id in ent_ids for _id in ids]):
                # ok, all entities in this relation are shown in this sentence
                rels.append(tag)

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
    for i, ent in enumerate(ents):
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
        ents[i]['token_index'] = ent_token_idx

    # return the updated entities
    return ents


def convert_ann_to_sentag(ann, is_exclude_no_entity_sentence = True):
    '''
    Convert an ann to a sentence-based tag collection
    '''
    # first, create a record
    r = {
        "text": ann['text'],
        "sentence_tags": []
    }

    # get the sentences
    sents = get_sentences(ann['text'])

    # for each sentence
    for sent in sents:
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
            ann['tags']
        )

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


def convert_anns_to_sentags(anns, is_exclude_no_entity_sentence = True):
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
            is_exclude_no_entity_sentence
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

    print(ret)