# FLASK APP Configs
DEBUG=True
SECRET_KEY='ja6sx-3dix-98x72-87syts-019xf'

# for development 
DEV_LISTEN='0.0.0.0'
DEV_PORT=8086

# static page
STATIC_PAGE_ROOT_PATH='docs'

# the MedTator version
MEDTATOR_VERSION='1.0.2'

# library base
LIB_BASE='cdn'

# third-party libraries
THIRD_PARTY_LIB_URL={
'local': {
    'METRO_UI': {
        'CSS': "./static/lib/metroui/css/metro-all.min.css",
        'JS': "./static/lib/metroui/js/metro.min.js"
    },
    'FONT_AWESOME': {
        'CSS': "./static/lib/font-awesome/css/all.min.css"
    },
},
'cdn': {
    'METRO_UI': {
        'CSS': "https://cdn.metroui.org.ua/v4.3.2/css/metro-all.min.css",
        'JS': "https://cdn.metroui.org.ua/v4.3.2/js/metro.min.js"
    },
    'FONT_AWESOME': {
        'CSS': "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
    },
    'JQUERY': {
        'JS': "https://code.jquery.com/jquery-3.4.1.min.js"
    },
    'JQUERY_UI': {
        'CSS': "https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.css",
        'JS': "https://code.jquery.com/ui/1.12.0/jquery-ui.min.js"
    },
    'CODE_MIRROR': {
        'CSS': "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.62.0/codemirror.min.css",
        'JS': ""
    },
}}