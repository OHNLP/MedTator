'''
Annotation XML Kits

This is for operating the annotation files
'''

import os
import argparse
from xml.dom import minidom
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
            
            # finally, save this ann
            anns.append(ann)
            print('* parsed XML file %s' % full_fn)

    print('* checked %s files' % cnt_total)
    print('* found %s XML files' % cnt_xml)
    print('* skipped %s non-XML files' % cnt_other)

    ret = {
        "anns": [],
        "stat": {}
    }
    return ret

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Annotation XML Kits')
    parser.add_argument('path',
                        help='the path to the folder that contains annotation files')

    args = parser.parse_args()

    # get the files 
    ret = parse_xmls(args.path)

    print(ret)