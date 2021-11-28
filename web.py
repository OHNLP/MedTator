'''
The development server for MedTator
'''
import os
import json

from flask import Flask, render_template
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

    print('* building static MedTator ...')
    print('*   path: %s' % (path))
    print('*   filename: %s' % (filename))
    print('*   lib_base: %s' % (lib_base))

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

    print('* done building static MedTator!')


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

    with open(fn, 'w') as f:
        f.write(rv.data.decode('utf8'))
    
    print('* made %s -> %s' % (url, fn))


if __name__=='__main__':
    import argparse

    parser = argparse.ArgumentParser(description='MedTator Development Server and Toolkit')

    # add paramters
    parser.add_argument("--mode", type=str, 
        choices=['build', 'run'], default='run',
        help="What do you want to do? `run` for starting the development server. `build` for generating a static HTML page for public release or local release.")

    parser.add_argument("--lib", type=str, 
        choices=['local', 'cdn'], default='cdn',
        help="Where to get third party libs in the HTML page? If choose local, please make sure to copy the `static` folder after generated the HTML file.")

    parser.add_argument("--path", type=str, default=None,
        help="Which folder to be used for the output page? The default folder is the docs/ folder for public release.")

    parser.add_argument('--fn', type=str, default='index.html',
        help="What file name to be used for the output page? The default file name is the `index.html` which could be accessed directly by browser.")

    args = parser.parse_args()

    if args.mode == 'run':
        app.run(
            host=app.config['DEV_LISTEN'],
            port=app.config['DEV_PORT'],
            # ssl_context='adhoc'
        )

    elif args.mode == 'build':
        build(args.path, args.fn, args.lib)

    else:
        parser.print_usage()
