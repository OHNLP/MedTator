async function fs_open_files(pickerOpts) {
    const fhs = await window.showOpenFilePicker(pickerOpts);
    return fhs;
}

async function fs_read_txt_file_handle(fh, dtd_name, enabled_sentences) {
    if (typeof(dtd_name) == 'undefined') {
        dtd_name = '';
    }
    if (typeof(enabled_sentences) == 'undefined') {
        enabled_sentences = false;
    }
    const file = await fh.getFile();
    const text = await file.text();

    // create ann
    var ann = ann_parser.txt2ann(text, dtd_name);

    // bind the fh
    ann._fh = fh;

    // bind the filename seperately
    ann._filename = fh.name;

    // bind a status
    ann._has_saved = true;

    // bind the sentences
    if (enabled_sentences) {
        var result = nlp_toolkit.sent_tokenize(ann.text, 'wink_nlp');
        ann._sentences = result.sentences;
        ann._sentences_text = result.sentences_text;
    } else {
        ann._sentences = null;
        ann._sentences_text = null;
    }

    return ann;
}

async function fs_read_ann_file_handle(fh, dtd, enabled_sentences) {
    if (typeof(enabled_sentences) == 'undefined') {
        enabled_sentences = true;
    }
    const file = await fh.getFile();
    const text = await file.text();

    // create ann
    var ann = ann_parser.xml2ann(text, dtd);

    // bind the fh
    ann._fh = fh;

    // bind the filename seperately
    ann._filename = fh.name;

    // bind a status
    ann._has_saved = true;

    // bind the sentences
    if (enabled_sentences) {
        var result = nlp_toolkit.sent_tokenize(ann.text);
        ann._sentences = result.sentences;
        ann._sentences_text = result.sentences_text;
    } else {
        ann._sentences = null;
        ann._sentences_text = null;
    }

    return ann;
}

async function fs_read_dtd_file_handle(fh) {
    const file = await fh.getFile();
    const text = await file.text();

    // create dtd
    var dtd = dtd_parser.parse(text);

    return dtd;
}

async function fs_write_ann_file(fh, content) {
    const writable = await fh.createWritable();
    
    // write the contents
    await writable.write(content);

    // close the file
    await writable.close();

    return fh;
}

async function fs_get_new_ann_file_handle(fn) {
    const options = {
    suggestedName: fn,
      types: [
        {
          description: 'Text Files',
          accept: {
            'text/xml': ['.xml'],
          },
        },
      ],
    };
    const handle = await window.showSaveFilePicker(options);
    return handle;
}

async function fs_save_new_ann_file(ann, dtd) {
    // create a new fh by the suggested ann filename
    const fh = await fs_get_new_ann_file_handle(ann._filename);

    // update the filename according to fh
    ann._fh = fh;
    ann._filename = fh.name;

    // create the xml content for writing to file
    var xmlDoc = ann_parser.ann2xml(ann, dtd);
    const content = ann_parser.xml2str(xmlDoc, false);

    // write to fh!
    await fs_write_ann_file(ann._fh, content);

    // done!
    ann._has_saved = true

    return ann;
}

async function fs_save_ann_file(ann, dtd) {
    // create the xml content for writing to file
    var xmlDoc = ann_parser.ann2xml(ann, dtd);
    const content = ann_parser.xml2str(xmlDoc, false);

    // write to fh!
    await fs_write_ann_file(ann._fh, content);

    // done!
    ann._has_saved = true

    return ann;
}