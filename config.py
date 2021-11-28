# FLASK APP Configs
DEBUG=True
SECRET_KEY='ja6sx-3dix-98x72-87syts-019xf'

# for development 
DEV_LISTEN='0.0.0.0'
DEV_PORT=8086

# static page
STATIC_PAGE_ROOT_PATH='docs'

# the MedTator version
MEDTATOR_VERSION='1.1.0'

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
    'JQUERY': {
        'JS': "./static/lib/jquery/jquery-3.4.1.min.js"
    },
    'JQUERY_UI': {
        'CSS': "./static/lib/jqueryui/jquery-ui.min.css",
        'JS': "./static/lib/jqueryui/jquery-ui.min.js"
    },
    'VUE': {
        'JS': "./static/lib/vue/vue.min.js"
    },
    'JSZIP': {
        'JS': './static/lib/jszip/jszip.min.js'
    },
    'FILESAVER': {
        'JS': "./static/lib/filesaver/FileSaver.min.js"
    },
    'DAYJS': {
        'JS': "./static/lib/dayjs/dayjs.min.js"
    },
    'CODE_MIRROR': {
        'CSS': "./static/lib/codemirror/codemirror.css",
        'JS': "./static/lib/codemirror/codemirror.js",
        'JS_ADDON_ACTIVE_LINE': "./static/lib/codemirror/addon/selection/active-line.js"
    },
    'NUMJS': {
        'JS': "./static/lib/numjs/numjs.min.js"
    },
    'COMPROMISE': {
        'JS': "./static/lib/compromise/compromise-13.11.4.min.js"
    },
    'PAPAPARSE': {
        'JS': "./static/lib/papaparse/papaparse.min.js"
    },
    'SHEPHERD': {
        'CSS': "./static/lib/shepherd/shepherd.css",
        'JS': "./static/lib/shepherd/shepherd.min.js"
    },
    'WINK_NLP': {
        'JS': "./static/lib/wink-nlp/bundle-1.8.0.min.js"
    },
    'DS_SPLITER': {
        'JS': "./static/lib/ds-spliter/ds-spliter-1.0.0.min.js"
    },
    'XML_FORMATTER': {
        'JS': "./static/lib/xml-formatter/xml-formatter.js"
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
    'VUE': {
        'JS': "https://cdn.jsdelivr.net/npm/vue@2.6.11"
    },
    'JSZIP': {
        'JS': 'https://stuk.github.io/jszip/dist/jszip.js'
    },
    'FILESAVER': {
        'JS': "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.min.js"
    },
    'DAYJS': {
        'JS': "https://cdnjs.cloudflare.com/ajax/libs/dayjs/1.8.36/dayjs.min.js"
    },
    'CODE_MIRROR': {
        'CSS': "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.62.0/codemirror.min.css",
        'JS': "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.62.0/codemirror.min.js",
        'JS_ADDON_ACTIVE_LINE': "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.62.2/addon/selection/active-line.min.js"
    },
    'NUMJS': {
        'JS': "https://cdn.jsdelivr.net/gh/nicolaspanel/numjs@0.15.1/dist/numjs.min.js"
    },
    'COMPROMISE': {
        'JS': "https://unpkg.com/compromise"
    },
    'PAPAPARSE': {
        'JS': "https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.1/papaparse.min.js"
    },
    'SHEPHERD': {
        'CSS': "https://cdn.jsdelivr.net/npm/shepherd.js@8.3.1/dist/css/shepherd.css",
        'JS': "https://cdn.jsdelivr.net/npm/shepherd.js@8.3.1/dist/js/shepherd.min.js"
    },
    'WINK_NLP': {
        'JS': "./static/lib/wink-nlp/bundle-1.8.0.min.js"
    },
    'DS_SPLITER': {
        'JS': "./static/lib/ds-spliter/ds-spliter-1.0.0.min.js"
    },
    'XML_FORMATTER': {
        'JS': "https://cdn.jsdelivr.net/npm/xml-formatter@2.4.0/dist/browser/xml-formatter.js"
    },
}}

# Samples
# Each record contains
# 1. ID, which is used for ID, variable name, and file name 
# 2. Menu name
# 3. Menu description
# None item represents a seperate line
TASK_SAMPLES = [
    ['MINIMAL_TASK', 'Minimal Annotation Task', 'A minimal annotation task'],
    ['ENTITY_RELATION_TASK', 'Entity and Relation Annotation', 'A sample for entity and relation annotation'],
    ['DOCUMENT_LEVEL_TASK', 'Document-Level Annotation', 'A sample for document level annotation samples'],
    ['IAA_TASK', 'IAA Calculation', 'A sample for IAA calculation'],
    None,
    ['AMIA21_WORKSHOP', 'AMIA 2021 Workshop', 'A sample task for AMIA 2021 workshop annotation presentation'],
]