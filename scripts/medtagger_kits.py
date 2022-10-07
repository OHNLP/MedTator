'''
MedTagger NLP Toolkits

This is for operating the output files of MedTagger in the JSON format.
You can use this module to create JSON format output files.
'''

import os
import argparse

def parse_ann(full_fn):
    '''
    Parse a given MedTagger ann file
    '''
    fn = os.path.basename(full_fn)
    ann = {
        # about the file itself
        "_filename": fn,
    }

    return ann


def parse_anns(path):
    '''
    Parse the given path which contains the MedTagger outputs
    '''
    print('* checking path %s' % path)

    anns = []

    # count files
    cnt_total = 0
    cnt_other = 0
    cnt_ann = 0
    cnt_tags = 0

    if os.path.isfile(path):
        cnt_total += 1
        if path.lower().endswith('.xml'): 
            cnt_ann += 1

            # parse this ann
            ann = parse_ann(path)

            # update stats
            cnt_tags += len(ann['tags'])

            # save this
            anns.append(ann)
            print('* parsed ANN file %s' % path)

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
                cnt_ann += 1
                
                # ok, this is a XML file
                full_fn = os.path.join(root, fn)

                # parse this ann
                ann = parse_ann(full_fn)

                # update the number of tags
                cnt_tags += len(ann['tags'])
                
                # finally, save this ann
                anns.append(ann)
                print('* parsed XML file %s' % full_fn)

    print('* checked %s files' % cnt_total)
    print('* found %s ANN files' % cnt_ann)
    print('* skipped %s non-ANN files' % cnt_other)

    ret = {
        "anns": anns,
        "stat": {
            # for files
            "total_files": cnt_total,
            "total_ann_files": cnt_ann,
            "total_other_files": cnt_other,
            # for tags
            "total_tags": cnt_tags
        }
    }
    return ret


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='MedTagger ANN Kits')
    parser.add_argument('path',
                        help='the path to the folder that contains MedTagger output files')

    # update the args
    args = parser.parse_args()

    # get the files 
    ret = parse_anns(args.path)

    print(ret)