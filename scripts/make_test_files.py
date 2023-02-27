"""Make files for test

This script allows the user to make many test files
"""

import os
import string
import random
import argparse
import datetime

# the output path
fn_words = '../sample/IAA_TASK/raw_txt/doc_1.txt'

# create words
def make_files(n_files, n_words_per_doc, path):
    # please modify the output path
    path_output = os.path.join(
        path,
        'sample-corpus-%s-%s' % (
            datetime.datetime().now().strftime("%Y-%m-%d"),
            n_files
        )
    )

    words = open(fn_words).read().split()
    print('* found %d words' % (len(words)))

    # for creating randome str
    fnid = lambda n: ''.join(random.choice(string.ascii_uppercase + string.digits) for _ in range(n))

    # create output folder
    if os.path.exists(path_output):
        print("* found output path %s" % path_output)
    else:
        os.makedirs(path_output)
        print('* created output path %s' % (path_output))

    for i in range(n_files):
        # create content
        ws = random.sample(words, n_words_per_doc)
        c = ' '.join(ws)

        # output
        fn = os.path.join(
            path_output,
            'doc_%05d_%s.txt' % (i, fnid(6))
        )
        f = open(fn, 'w')
        f.write(c)
        f.close()
        print('* %05d/%05d file %s is made' % (i+1, n_files, fn))

    print('* done')
    

if __name__ == '__main__':
    parser = argparse.ArgumentParser('Sample Corpus Maker')
    parser.add_argument('-n', type=int, default=100, help='The number of files to be created')
    parser.add_argument('-w', type=int, default=100, help='The number of words per document')
    parser.add_argument('-p', type=str, default='../../', help='The output path of the corpus')

    # parse
    args = parser.parse_args()

    # run!
    make_files(args.n, args.w, args.p)
