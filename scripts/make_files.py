"""Make files for test

This script allows the user to make many test files
"""

import os
import string
import random
# from tqdm import tqdm

# the number of files
n_files = 1000

# the number of words in a doc
n_words_per_doc = 100

# the output path
fn_words = '../sample/IAA_TASK/raw_txt/doc_1.txt'

# please modify the output path
path_output = '../../../test-output-%s/' % n_files

# create words
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
        'doc_%05d_%s.txt' % (i, '-'.join([fnid(6), fnid(6), fnid(6), fnid(6)]))
    )
    f = open(fn, 'w')
    f.write(c)
    f.close()
    print('* %05d/%05d file is made' % (i+1, n_files))

print('* done')
    
