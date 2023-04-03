'''
MedTator Annotation XML Toolkits

This is for operating the annotation files in the JSON format.
You can use this module to create JSON format annotation files.

The saving XML function `save_xml` requires lxml.
Please install lxml first

```bash
pip install lxml
```
'''

from copy import deepcopy
import os
import argparse
from xml.dom.minidom import parse

def parse_xml(full_fn):
    '''
    Parse a given MedTator XML file
    '''
    fn = os.path.basename(full_fn)

    # create an ann for saving data
    ann = {
        # about the file itself
        "_filename": fn,
        # the root tag
        "root": '', 
        # the text content of this annotation file
        "text": '',
        # the metadata
        "meta": {},
        # the tags
        "tags": []
    }

    # read this file
    dom = parse(full_fn)

    # get text directly as there is only one TEXT tag
    ann['text'] = dom.getElementsByTagName('TEXT')[0].childNodes[0].data

    # get the root name
    ann['root'] = dom.firstChild.nodeName

    # TODO: now parse the meta
    if len(dom.getElementsByTagName('META')) == 0:
        # no <META>, just skip
        pass
    else:
        meta_nodes = dom.getElementsByTagName('META')[0].childNodes
        for mt_node in meta_nodes:
            if mt_node.nodeType == mt_node.TEXT_NODE:
                # which mean it's a text such as \n or space
                continue

            # use the node name as tag name
            if mt_node.nodeName not in ann['meta']:
                # create a list of new items
                ann['meta'][mt_node.nodeName] = []

            mt_tag = {}
            attrs = mt_node.attributes.items()
            for attr in attrs:
                mt_tag[attr[0]] = attr[1]

            # save this meta
            ann['meta'][mt_node.nodeName].append(mt_tag)

    # now parse the tags
    nodes = dom.getElementsByTagName('TAGS')[0].childNodes
    for node in nodes:
        if node.nodeType == node.TEXT_NODE:
            # which mean it's a text such as \n or space
            continue

        # create a new tag
        tag = {}

        # get the tag_name
        tag_name = node.nodeName
        tag['tag'] = tag_name

        # get all attrs
        attrs = node.attributes.items()
        for attr in attrs:
            if attr[0] == 'spans':
                # OK, we can convert the spans to int number
                # the spans can be 1~2,3~4,5~6 format
                # so need to split by "," first, then split by "~"
                spans = list(map(lambda x: list(map(lambda v: int(v), x.split('~'))), attr[1].split(',')))
                tag['spans'] = spans
            else:
                tag[attr[0]] = attr[1]

        # save this tag
        ann['tags'].append(tag)

    return ann


def parse_xmls(path):
    '''
    Parse the given path which contains the MedTator XML files.
    '''
    print('* checking path %s' % path)

    # count files
    cnt_total = 0
    cnt_other = 0
    cnt_xml = 0
    cnt_tags = 0

    anns = []

    if os.path.isfile(path):
        cnt_total += 1
        if path.lower().endswith('.xml'): 
            cnt_xml += 1

            # parse this ann
            ann = parse_xml(path)

            # update stats
            cnt_tags += len(ann['tags'])

            # save this
            anns.append(ann)
            print('* parsed XML file %s' % path)

        else:
            cnt_other += 1
        
    else:
        for root, dirs, files in os.walk(path):
            for fn in files:
                cnt_total += 1
                # check file
                if not fn.lower().endswith('.xml'): 
                    cnt_other += 1
                    continue

                # ok, this is a XML
                cnt_xml += 1
                
                # ok, this is a XML file
                full_fn = os.path.join(root, fn)

                # parse this ann
                ann = parse_xml(full_fn)

                # update the number of tags
                cnt_tags += len(ann['tags'])
                
                # finally, save this ann
                anns.append(ann)
                print('* parsed XML file %s' % full_fn)

    print('* checked %s files' % cnt_total)
    print('* found %s XML files' % cnt_xml)
    print('* skipped %s non-XML files' % cnt_other)

    ret = {
        "anns": anns,
        "stat": {
            # for files
            "total_files": cnt_total,
            "total_xml_files": cnt_xml,
            "total_other_files": cnt_other,
            # for tags
            "total_tags": cnt_tags
        }
    }
    return ret


def save_xml(ann, full_path):
    '''
    Save the given ann as a XML file to specific path
    '''
    from lxml import etree as ET

    # create root element
    root = ET.Element(ann['root'])

    # create sub elements
    meta = ET.SubElement(root, "META")
    text = ET.SubElement(root, "TEXT")
    tags = ET.SubElement(root, "TAGS")

    # add text
    text.text = ET.CDATA(ann['text'])

    # add meta
    for mt_key in ann['meta']:
        for mt_val_dict in ann['meta'][mt_key]:
            elem = ET.SubElement(
                meta,
                mt_key,
                attrib=mt_val_dict
            )

    # add tags
    for tag in ann['tags']:
        # get all attrs
        attrs = deepcopy(tag)
        # remove the tag attr
        del attrs['tag']
        # convert spans
        spans = []
        for sp in attrs['spans']:
            spans.append('%s~%s' % (sp[0], sp[1]))
        attrs['spans'] = ','.join(spans)

        # create a new node
        elem = ET.SubElement(
            tags, 
            tag['tag'],
            attrib=attrs
        )

    # save the xml file
    # No indent saving
    tree = ET.ElementTree(root)
    ET.indent(tree, space='', level=0)
    tree.write(
        full_path,
        encoding='utf8',
        xml_declaration=True
    )

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Annotation XML Kits')
    parser.add_argument('path',
                        help='the path to the folder that contains annotation files')

    # update the args
    args = parser.parse_args()

    # get the files 
    ret = parse_xmls(args.path)

    print(ret)