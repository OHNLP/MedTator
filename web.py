'''
The development server for
'''
import os
import pathlib

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


# routers
@app.route('/')
@app.route('/index.html')
def index():
    return render_template('index.html')

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(
        os.path.join(app.root_path, 'static'),
        'favicon.ico', mimetype='image/vnd.microsoft.icon'
    )

def build(path):
    '''
    Build the static annotator
    '''
    import shutil

    # create the folder
    pathlib.Path(
        os.path.join(path, 'static', 'data')
    ).mkdir(
        parents=True,
        exist_ok=True
    )

    # copy the sample data
    path_src = os.path.join(
        pathlib.Path(__file__).parent.absolute(),
        'docs', 'static', 'data',
        'vpp_data_sample.json'
    )
    path_dst = os.path.join(
        path, 'static', 'data', 
        'vpp_data_sample.json'
    )
    shutil.copy(path_src, path_dst, )

    # download the page
    with app.test_client() as client:
        with app.app_context():
            make_page(
                client, 
                "/index.html", 
                path,
                "index.html"
            )

    print('* done building static annotator')


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

    with open(fn, 'w') as f:
        f.write(rv.data.decode('utf8'))
    
    print('* made static page %s' % (fn))


if __name__=='__main__':
    import argparse

    parser = argparse.ArgumentParser(description='MedTator Development Server')

    # add paramters
    parser.add_argument("--mode", type=str, 
        choices=['build', 'run'], default='run',
        help="Which mode?")
    parser.add_argument("--path", type=str, 
        help="Which path for the built page?")

    args = parser.parse_args()

    if args.mode == 'run':
        app.run(
            host=app.config['DEV_LISTEN'],
            port=app.config['DEV_PORT'])

    elif args.mode == 'build':
        build(args.path)

    else:
        parser.print_usage()
