'''
A demo script for showing how to mask entities in MedTator XML

For example, for a given XML

```xml
<?xml version="1.0" encoding="UTF-8" ?>
<VAX_AE_MED>
<TEXT><![CDATA[The fever broke about 102 F this morning (1/10/21) so a rough estimate of the time course is 32 h.]]></TEXT>
<TAGS>
<META/>
<AE spans="4~9" text="fever" id="A0"/>
<SVRT spans="22~27" text="102 F" id="S1"/>
<DATE spans="42~46" text="1/10" id="D1"/>
</TAGS>
</VAX_AE_MED>
```

We want to mask the `fever` (replace with ##AE##) and date information, while keeping other entities in the annotation for downstream tasks, such as question answering.
As the spans of the replaced tokens may cause the length of text changed, we need to tracking the changes and apply the offset to other affected tokens of entities.
This script show an example of how this can be done.

After masking, the output XML looks like:

```xml
<?xml version='1.0' encoding='UTF8'?>
<VAX_AE_MED>
<META/>
<TEXT><![CDATA[The ##AE## broke about 102 F this morning (##DT##/21) so a rough estimate of the time course is 32 h.]]></TEXT>
<TAGS>
<SVRT spans="23~28" text="102 F" id="S1"/>
</TAGS>
</VAX_AE_MED>
```

As you can see, the `fever` and `1/10` are masked. As the text changes, the offset of SVRT `102 F` is changed from 22~27 to 23~28. All the masked entites are removed from the <TAGS> element.

You can check more technical details in this script.
'''

import os
import medtator_kits as mtk

# first, we need to define which tags should be masked and kept.
# in this demo, we want to mask the AE and DATE, keep the SVRT.
# if any tag is not defined here, will be DROPPED directly,
# which means they won't affect the kept tags.
MASK_TAGS = [
    ['AE', '##AE##'],
    ['DATE', '##DT##']
]
KEPT_TAGS = ['SVRT']
# create a list for quick access later
# it only contains the name, for example ['AE', 'DATE']
MASK_TAGS_NAMES = [ t[0] for t in MASK_TAGS ]
# convert to a mapping dict from tag to mask
MASK_TAGS_DICT = dict(MASK_TAGS)

print('* defined MASK tags:')
for mt in MASK_TAGS: print('  - %s -> %s' % (mt[0], mt[1]))
print('* defined KEPT tags:')
for kt in KEPT_TAGS: print('  - %s ' % (kt))

# then, let's define the path for the input XML files
# for this demo, we use the path in our sample dataset
# it contains 5 xml files for testing
path = '../sample/ENTITY_RELATION_TASK/ann_xml/Annotator_A/'
if os.path.exists(path):
    print("* found the input path %s" % path)
else:
    print('* no such path %s' % path)
    exit()

# then define the output path for the masked format file
output_path = '../../masked_xmls/'
if os.path.exists(output_path):
    print('* found the output path %s' % output_path)
else:
    os.makedirs(output_path)
    print('* created output path %s' % output_path)

# now, parse the XML files in the given path.
# it's just the raw XML files with basic conversion
# all annotation files are saved in the rst['anns']
# each item in the rst['anns'] is an object like this:
# 
# {
#     "_filename": 'test.xml',
#     "root": 'VAX',
#     "text": 'The fever broke about 102 F this morning (1/10/21) so a rough estimate of the time course is 32 h.',
#     "meta": {},
#     "tags": [{
#         'tag': 'AE',
#         'spans': [[4, 9]],
#         'text': 'fever',
#         'id': 'P0'
#     }, {
#         'tag': 'SVRT',
#         'spans': [[22, 27]],
#         'text': '102 F',
#         'id': 'S1'
#     }, {
#         'tag': 'DATE',
#         'spans': [[42, 46]],
#         'text': '1/10',
#         'id': 'D1'
#     }]
# }
# 
# the annotated tags will be saved as a list of objects in `tags`.
# As MedTator support non-continous spans, 
# the `spans` of each tag is a 2-D array.
# For most of cases, it should be only one row.
rst = mtk.parse_xmls(path)

# let's define a function to evaluate the affectness
def does_tag1_affect_tag2(tag1, tag2, mask):
    '''
    Compare the positions of tags with given mask for tag1
    return flag and the offsets
    For example:
       False, [0, 0]
       True, [1, 1]
       True, [0, 0]
    
    There are several cases:

    1. no, tag1 won't affect tag2
            tag1
    tag2

    2. yes, if tag1 is ahead of tag2
    tag1
            tag2
    
    3. yes, if covered
    tag_1_is_big
      tag2

    4. yes, but only affect the right span
      tag1
    tag_2_is_big

    5. yes, if partly overlapped
    tag1
      tag2

    6. yes, but only affect the right span
      tag1
    tag2
    '''
    # the offset caused by mask 
    # For example, if tag1 is Jan.01 and mask is ##DT##, 
    # then offset is 6 - 6 = 0
    # if tag1 is March 31 and mask is ##DT##,
    # the offset is 6 - 8 = -2
    # 
    # this is the easist case. 
    # we don't handle the non-continuous text for now
    offset = len(mask) - len(tag1['text'])

    # get the range of spans
    # range1 = [
    #     tag1['spans'][0][0],  # the first span's left
    #     tag1['spans'][-1][1]  # the last span's right
    # ]
    # range2 = [
    #     tag2['spans'][0][0],  # the first span's left
    #     tag2['spans'][-1][1]  # the last span's right
    # ]
    # for simplicity, we don't count the non-continuous spans
    range1 = tag1['spans'][0]
    range2 = tag2['spans'][0]

    # let's start with the easist case
    if range1[0] > range2[1]:
        # this is case 1, not affect
        return False, [0, 0]

    # then, easy case 2
    if range1[1] < range2[0]:
        # this is case 2, yes
        return True, [offset, offset]

    # then, for case 3, it's better just remove tag2
    if range1[0] <= range2[0] and \
       range1[1] >= range2[1]:
        return True, [None, None]

    # then, for case 4, it only affect the right span
    if range1[0] >= range2[0] and \
       range1[1] <= range2[1]:
        return True, [0, offset]

    # then for case 5, cut tag2's head, and translate to case 2
    if range1[0] <= range2[0] and \
       range1[1] >= range2[0] and \
       range1[1] <= range2[1]:
        return True, [range2[0] - range1[1] + offset, offset]

    # last, for case 6, cut tag2's tail, and translate to case 1
    if range1[0] >= range2[0] and \
       range1[0] <= range2[1] and \
       range1[1] >= range2[1]:
        return True, [0, range1[0] - range2[1]]
    
    # ???, yes, but I don't what is affected?
    return True, None


# then, we can mask the entities in each annotation
len_rst_anns = len(rst['anns'])
for ann_idx, ann in enumerate(rst['anns']):
    print('*' * 10, '%s/%s:%s' % (ann_idx+1, len_rst_anns, ann['_filename']), '*' * 10)
    # first, get all tags
    tags = ann['tags']

    # then, find those tags to be masked and kept
    masked_tags = []
    kept_tags = []
    for tag in tags:
        if tag['tag'] in MASK_TAGS_NAMES:
            # ok, this a tag to be masked
            masked_tags.append(tag)

        elif tag['tag'] in KEPT_TAGS:
            # this is a tag to be kept
            kept_tags.append(tag)

        else:
            # just drop this undefined tags
            pass
    print('* found %s tags to be masked' % (len(masked_tags)))
    print('* found %s tags to be kept' % (len(kept_tags)))

    # then, we need to evaluate how those masked tags affect kept tags.
    # and, to avoid the masked tags affect each other
    # the final replacement (i.e., mask) should be done at last.
    # check each kept tag now
    for k_tag in kept_tags:
        # TODO: no need to calculate DOCUMENT level tags

        # save all offsets
        offset_list = []

        # check each mask tag to see whether it affects
        for m_tag in masked_tags:
            # to check whether this m_tag affect k_tag
            # we need to compare two tags
            mask = MASK_TAGS_DICT[m_tag['tag']]
            flag_affected, tag_offset = does_tag1_affect_tag2(m_tag, k_tag, mask)

            if flag_affected:
                if tag_offset is None:
                    # ??? In fact, I don't what to do
                    continue
                elif tag_offset[0] is None:
                    # oh ... that's bad!
                    # k_tag is completely overlapped with m_tag
                    # it's better to do something here ...
                    pass
                else:
                    offset_list.append(tag_offset)
            else:
                # ok, that's great! tag_offset is just [0, 0]
                offset_list.append(tag_offset)

        # now, let's apply all the offsets to this tag
        offset_sum = [0, 0]
        for offset in offset_list:
            offset_sum[0] += offset[0]
            offset_sum[1] += offset[1]
        
        # update the offset
        k_tag['spans'][0][0] += offset_sum[0]
        k_tag['spans'][0][1] += offset_sum[1]

        print('* applied offset [%s, %s] to tag %s.%s:%s' % (
            offset_sum[0],
            offset_sum[1],
            k_tag['tag'],
            k_tag['id'],
            k_tag['text'],
        ))

    # now, let's apply all the changes of text in the full text.
    # to avoid break the span, we shouldn't use regex to replace text.
    # need to cut the full text into pieces and join the original and replaced.
    # TODO: for masked tags, there can be overlapped tokens ...

    # first, make a dict of indexes of masked spans to mask 
    # for example, for two tags 0~3 and 8~10
    # masked_idx_dict is {
    #    0: ##MASK_TAG1##,
    #    1: ##MASK_TAG1##,
    #    2: ##MASK_TAG1##,
    #    8: ##MASK_TAG2##,
    #    9: ##MASK_TAG2##,
    # }
    # later we can use this set to test whether a character is masked
    masked_idx_dict = {}
    for tag in masked_tags:
        # we just use the first one
        spans = tag['spans'][0]
        # put all index values between spans
        for i in range(spans[0], spans[1]):
            masked_idx_dict[i] = MASK_TAGS_DICT[tag['tag']]

    # save all chars for the new text
    new_text_chars = []
    # the fulltext
    text = ann['text']
    # define the start flag
    flag_masked_token_start = True
    for i in range(len(text)):
        if i in masked_idx_dict:
            # ok this char is masked
            if flag_masked_token_start:
                # ok, this is the start position
                new_text_chars.append(masked_idx_dict[i])
                flag_masked_token_start = False
            else:
                # we have add the mask of this token
                # so just skip here
                pass
        else:
            if flag_masked_token_start:
                # ok, which means it's trying to locate next mask
                # just add this char
                new_text_chars.append(text[i])
            else:
                # which means, just finished a mask token
                # i.e., text[i-1] is a masked token
                # text[i] is a new unmask token now
                flag_masked_token_start = True
                new_text_chars.append(text[i])

    # combine all chars
    new_text = ''.join(new_text_chars)

    # finally, make the masked annotation file
    masked_ann = {
        "_filename": 'masked_' + ann['_filename'],
        "root": ann['root'],
        "text": new_text,
        "meta": ann['meta'],
        "tags": kept_tags
    }

    # save this ann
    output_full_fn = os.path.join(output_path, masked_ann['_filename'])
    mtk.save_xml(masked_ann, output_full_fn)
    print('* saved XML %s' % output_full_fn)


print('* done!')