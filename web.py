'''
The development server for MedTator
'''
import os
import re
import json

from flask import Flask
from flask import render_template
from flask import send_from_directory

# Create our little application :)
app = Flask(
    __name__,
    static_folder='docs/static'
)

# read config
app.config.from_pyfile('config.py')

# set for jinja template engine
app.jinja_env.variable_start_string = '[['
app.jinja_env.variable_end_string = ']]'
app.jinja_env.filters['jsonify'] = json.dumps


# routers
@app.route('/')
@app.route('/index.html')
def index():
    # the extra data for rendering page
    data = {}

    # get the lib_base to decide what to do
    lib_base = app.config['LIB_BASE']
    print('* lib_base=%s' % lib_base)

    if lib_base == 'cdn':
        # ok, nothing to do when using cdn
        pass
    else:
        # we can prepare some local data 
        # first, we want to get the samples
        data['sample_dict'] = {}
        sample_path = os.path.join(
            app.config['STATIC_PAGE_ROOT_PATH'],
            'static',
            'data'
        )
        for r in app.config['TASK_SAMPLES']:
            if r is None: continue
            # read the content from local
            fn = 'vpp_data_%s.json' % r[0]
            full_fn = os.path.join(
                app.root_path,
                sample_path, 
                fn
            )
            j = json.load(open(full_fn))
            data['sample_dict'][r[0]] = j

        # second, we want to get the sample DTD
        data['sample_dtd'] = {}
        sample_path = os.path.join(
            app.config['STATIC_PAGE_ROOT_PATH'],
            'static',
            'data'
        )
        for fn in os.listdir(sample_path):
            if not fn.endswith('.dtd'):
                continue

            # ok, this fn is a sample dtd file
            task_name = fn.split('.')[0]
            full_fn = os.path.join(
                app.root_path,
                sample_path, 
                fn
            )
            data['sample_dtd'][task_name] = open(full_fn).read()

    # get the changelog
    try:
        medtator_ver = app.config['MEDTATOR_VERSION']
        medtator_ver = medtator_ver.replace('.', '\.')
        ptn_latest_changelog = r"### (%s [\s\S]+?)###" % medtator_ver
        full_readme = open('./README.md').read()
        matches = re.finditer(
            ptn_latest_changelog, 
            full_readme, 
            re.MULTILINE
        )
        matches = list(matches)
        changelog_latest = matches[0].group(1)
    except Exception as err:
        print('* error parsing the change log', err)
        changelog_latest = app.config['MEDTATOR_VERSION']
    
    data['changelog_latest'] = changelog_latest

    # now let's render the page
    return render_template(
        'index.html',
        data=data
    )


@app.route('/favicon.ico')
def favicon():
    return send_from_directory(
        os.path.join(app.root_path, 'static'),
        'favicon.ico', mimetype='image/vnd.microsoft.icon'
    )


def build(path=None, filename='index.html', lib_base='cdn'):
    '''
    Build the static MedTator
    '''
    # reset the output path to static page
    if path is None:
        path = app.config['STATIC_PAGE_ROOT_PATH']
    
    if os.path.exists(path):
        print("* found output path %s" % path)
    else:
        os.makedirs(path, exist_ok=True)
        print('* created output path %s' % path)
        
    print('* building static MedTator ...')
    print('*   path: %s' % (path))
    print('*   filename: %s' % (filename))
    print('*   lib_base: %s' % (lib_base))

    import shutil
    import pathlib
    path_sample = os.path.join(
        pathlib.Path(__file__).parent.resolve(),
        'sample/'
    )
    path_static_data = os.path.join(
        path,
        'static/',
        'data/'
    )
    print('* located src sample path: %s' % path_sample)
    print('* prepared dst sample path: %s' % path_static_data)

    # first, copy sample dtd files
    # copy the DTD file to data folder
    for folder in os.scandir(path_sample):
        if not folder.is_dir(): 
            # skip non-folder
            continue
        
        for fn in os.listdir(folder):
            if not fn.endswith('.dtd'):
                # skip non-dtd files
                continue
            
            # get the full path
            full_fn = os.path.join(folder, fn)

            # copy to new file name
            new_fn = '%s.dtd' % (folder.name)
            full_new_fn = os.path.join(
                path_static_data,
                new_fn
            )
            # create the folder is not there
            os.makedirs(os.path.dirname(full_new_fn), exist_ok=True)
            shutil.copyfile(
                full_fn,
                full_new_fn
            )
            print("* copied %s to %s" % (
                full_fn,
                full_new_fn
            ))

    # then, reset the page
    # download the page
    # and for MedTator, this is only one HTML page
    # so we can pass the file name to this function
    with app.test_client() as client:
        with app.app_context():
            # set the LIB_BASE varible for third party libraries
            app.config['LIB_BASE'] = lib_base

            # make the page
            make_page(
                client, 
                "/index.html", 
                path,
                filename
            )

            if filename == 'index.html':
                # which means it is a public release
                # we need to make a version index automatically
                version_index_fn = "index.%s.html" % app.config['MEDTATOR_VERSION']
                make_page(
                    client, 
                    "/index.html", 
                    path,
                    version_index_fn
                )
                print('* made the version index: %s' % version_index_fn)

    print('* done building static MedTator %s!' % (
        app.config['MEDTATOR_VERSION']
    ))


def create_release():
    '''
    Create a release zip file that contains public and standalone
    '''
    import shutil

    # the final zip file name
    fn_release = 'MedTator-%s' % (
        app.config['MEDTATOR_VERSION']
    )

    # create the path for output
    p_src = 'docs'
    p_dst = 'tmp/%s' % fn_release

    # clear the tmp folder if exists
    if os.path.exists('tmp'):
        shutil.rmtree('tmp')
        print('* cleared the tmp folder if exists')

    # copy the main code files
    destination = shutil.copytree(
        p_src, 
        p_dst,
        # skip the public version
        ignore=shutil.ignore_patterns('index.*', "dev.html")
    )
    print('* copied code files to %s' % p_dst)

    # copy the sample data files
    destination = shutil.copytree(
        'sample', 
        os.path.join(p_dst, 'sample'),
        # skip the public version
        ignore=shutil.ignore_patterns('index.html')
    )
    print('* copied sample files to %s' % p_dst)

    # create zip
    shutil.make_archive(
        fn_release,
        'zip',
        p_dst
    )
    print('* made archive %s' % fn_release)

    # delete tmp
    shutil.rmtree('tmp')
    print('* removed temp files in %s' % p_dst)

    # done!
    print('* created release %s.zip!' % (
        fn_release
    ))
    

def make_page(client, url, path, new_fn=None, param=None):
    '''
    Make static page from url
    '''
    rv = client.get(url)

    if new_fn is None:
        fn = os.path.join(
            path,
            url[1:]
        )
    else:
        fn = os.path.join(
            path,
            new_fn
        )

    # just check if the file exsits
    if os.path.exists(fn):
        print('* overwrite the existed %s' % fn)

    # create the folder if it is not there
    os.makedirs(os.path.dirname(fn), exist_ok=True)

    with open(fn, 'w') as f:
        f.write(rv.data.decode('utf8'))
    
    print('* made %s -> %s' % (url, fn))


if __name__=='__main__':
    import argparse

    parser = argparse.ArgumentParser(description='MedTator Development Server and Toolkit')

    # add paramters
    parser.add_argument("--mode", type=str, 
        choices=['build', 'run', 'release'], default='run',
        help="What do you want to do? `run` for starting the development server. `build` for generating a static HTML page for public release or local release.")

    parser.add_argument("--ssl", type=str, 
        choices=['yes', 'no'], default='no',
        help="Enable SSL for development environment?")

    parser.add_argument("--lib", type=str, 
        choices=['local', 'cdn'], default='cdn',
        help="Where to get third party libs in the HTML page? If choose local, please make sure to copy the `static` folder after generated the HTML file.")

    parser.add_argument("--path", type=str, default=None,
        help="Which folder to be used for the output page? The default folder is the docs/ folder for public release.")

    parser.add_argument('--fn', type=str, default='index.html',
        help="What file name to be used for the output page? The default file name is the `index.html` which could be accessed directly by browser.")

    args = parser.parse_args()

    if args.mode == 'run':
        if args.ssl == 'yes':
            app.run(
                host=app.config['DEV_LISTEN'],
                port=app.config['DEV_PORT'],
                ssl_context='adhoc'
            )

        else:
            app.run(
                host=app.config['DEV_LISTEN'],
                port=app.config['DEV_PORT'],
            )

    elif args.mode == 'build':
        build(args.path, args.fn, args.lib)

    elif args.mode == 'release':
        create_release()

    else:
        parser.print_usage()
