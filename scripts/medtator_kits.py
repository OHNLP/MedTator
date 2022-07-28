'''
Annotation XML Kits

This is for operating the annotation files
'''

import os
import argparse
from xml.dom.minidom import parse

def parse_xmls(path):
    '''
    Parse the given path to get 
    '''
    print('* checking path %s' % args.path)

    # count files
    cnt_total = 0
    cnt_other = 0
    cnt_xml = 0
    cnt_tags = 0

    anns = []
    for root, dirs, files in os.walk(args.path):
        for fn in files:
            cnt_total += 1
            # check file
            if not fn.lower().endswith('.xml'): 
                cnt_other += 1
                continue

            # ok, this is a XML
            cnt_xml += 1
            
            # create an ann for saving data
            ann = {
                # about the file itself
                "_filename": fn,
                # the text content of this annotation file
                "text": '',
                # the metadata
                "meta": {},
                # the tags
                "tags": []
            }

            # ok, this is a XML file
            full_fn = os.path.join(root, fn)

            # read this file
            dom = parse(full_fn)

            # get text directly as there is only one TEXT tag
            ann['text'] = dom.getElementsByTagName('TEXT')[0].childNodes[0].data

            # now parse the meta

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
                    tag[attr[0]] = attr[1]

                # save this tag
                ann['tags'].append(tag)

                # update the stat
                cnt_tags += 1
            
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

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Annotation XML Kits')
    parser.add_argument('path',
                        help='the path to the folder that contains annotation files')

    # update the args
    args = parser.parse_args()

    # get the files 
    ret = parse_xmls(args.path)

    print(ret)