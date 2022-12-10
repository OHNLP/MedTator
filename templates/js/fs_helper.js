///////////////////////////////////////////////////////////
// General purpose fs functions
///////////////////////////////////////////////////////////

async function fs_open_files(pickerOpts) {
    const fhs = await window.showOpenFilePicker(pickerOpts);
    return fhs;
}

async function fs_get_file_system_handles_by_fhs(fhs, filter) {
    if (typeof(filter) == 'undefined') {
        filter = function(fn) {
            return true;
        }
    }
    // the final fshs
    var fshs = [];

    for (let i = 0; i < fhs.length; i++) {
        const fh = fhs[i];
        
        if (fh.kind == 'file') {
            if (!filter(fh.name)) {
                continue;
            }
            fshs.push(fh);

        } else if (fh.kind == 'directory') {
            for await (const sub_fsh of fh.values()) {
                if (sub_fsh.kind != 'file') {
                    continue;
                }
        
                // exclude hidden file
                if (sub_fsh.name.startsWith('.')) {
                    continue;
                }

                // exclude other files
                if (!filter(sub_fsh.name)) {
                    continue;
                }

                // ok, put this sub_fsh
                fshs.push(sub_fsh);
            }
        }
    }
    console.log('* got ' + fshs.length + ' file_system_handles');

    return fshs;
}

async function fs_get_file_texts_by_fhs(fhs, filter) {
    if (typeof(filter) == 'undefined') {
        filter = function(fn) {
            return true;
        }
    }
    // the items is the event.dataTransfer.items
    const fshs = await fs_get_file_system_handles_by_fhs(fhs, filter);

    var files = [];

    for await (const file of fshs.map(fh=>fs_read_file_system_handle(fh))) {
        files.push(file);
    }
    // console.log(files);
    
    console.log('* has read ' + files.length + ' files');
    return files;
}

async function fs_get_file_system_handles_by_items(items, filter) {
    if (typeof(filter) == 'undefined') {
        filter = function(fn) {
            return true;
        }
    }
    // the items is the event.dataTransfer.items
    var fshs = [];

    // items is not an Array list, so have to loop it
    var p_fshs = [];
    for (let i=0; i<items.length; i++) {
        // get this item as a FileSystemHandle Object
        // the getAsFileSystemHandle returns a Promise
        const p_fsh = items[i].getAsFileSystemHandle();
        p_fshs.push(p_fsh);
    }
    console.log('* got ' + p_fshs.length + ' promises of file_system_handles');

    // in this way, we can get all of the items
    // including files and directories
    for await (const fsh of p_fshs) {
        if (fsh.kind == 'file') {
            if (!filter(fsh.name)) {
                continue;
            }
            fshs.push(fsh);

        } else if (fsh.kind == 'directory') {
            for await (const sub_fsh of fsh.values()) {
                if (sub_fsh.kind != 'file') {
                    continue;
                }
        
                // exclude hidden file
                if (sub_fsh.name.startsWith('.')) {
                    continue;
                }

                // exclude other files
                if (!filter(sub_fsh.name)) {
                    continue;
                }

                // ok, put this sub_fsh
                fshs.push(sub_fsh);
            }
        }
    }
    console.log('* got ' + fshs.length + ' file_system_handles');
    
    return fshs;
}

async function fs_get_file_texts_by_items(items, filter) {
    if (typeof(filter) == 'undefined') {
        filter = function(fn) {
            return true;
        }
    }
    // the items is the event.dataTransfer.items
    const fshs = await fs_get_file_system_handles_by_items(items, filter);

    var files = [];

    for await (const file of fshs.map(fh=>fs_read_file_system_handle(fh))) {
        files.push(file);
    }
    // console.log(files);
    
    console.log('* has read ' + files.length + ' files');
    return files;
}

async function fs_read_file_system_handle(fh) {
    // get the file obj
    const file = await fh.getFile();

    // console.log('* read fsh', file);
    
    // get the text content
    const text = await file.text();

    // return the content and fh
    return {
        fh: fh,
        fn: fh.name,
        timestamp: file.lastModified,
        text: text
    };
}

///////////////////////////////////////////////////////////
// Customized functions of read/write for annotation
///////////////////////////////////////////////////////////

async function fs_read_dtd_file_handle(fh) {
    const file = await fh.getFile();
    const text = await file.text();

    // get the format
    var format = 'dtd';

    if (fh.name.toLowerCase().endsWith('.dtd')) {
        format = 'dtd';
    } else if (fh.name.toLowerCase().endsWith('.json')) {
        format = 'json';
    } else if (fh.name.toLowerCase().endsWith('.yaml')) {
        format = 'yaml'
    } else if (fh.name.toLowerCase().endsWith('.yml')) {
        format = 'yaml'
    } else {
        // ??? what can it be?
    }

    // create dtd
    var dtd = dtd_parser.parse(text, format);

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



///////////////////////////////////////////////////////////
// I think these functions won't be used
///////////////////////////////////////////////////////////

async function fs_read_dir_handle(fh, filter) {
    if (typeof(filter) == 'undefined') {
        filter = function(fn) {
            return true;
        }
    }
    var files = [];
    for await (const entry of fh.values()) {
        // Each entry is an instance of FileSystemFileHandle 
        // FileSystemFileHandle {kind: 'file', name: 'doc_04.txt'} 
        // console.log(entry);
        if (entry.kind != 'file') {
            console.log('* skip sub folder', entry.name);
            continue;
        }

        // exclude hidden file
        if (entry.name.startsWith('.')) {
            continue;
        }

        // exclude other files
        if (!filter(entry.name)) {
            continue;
        }

        const fobj = await fs_read_file_system_handle(entry);
        files.push(fobj)
    }
    console.log('* found ', files.length, 'files in', fh.name);
    // console.log('* files:', files);
    return files;
}

async function fs_read_ann_dir_handle(fh, dtd) {
    for await (const entry of fh.values()) {
        // Each entry is an instance of FileSystemFileHandle 
        // FileSystemFileHandle {kind: 'file', name: 'doc_04.txt'} 
        // console.log(entry);
        if (entry.kind != 'file') {
            console.log('* skip sub folder', entry.name);
            continue;
        }

        // skip hidden files
        if (entry.name.startsWith('.')) {
            continue;
        }

        // call the app_hotpot to parse and decide this fh
        app_hotpot.parse_ann_file_fh(
            entry, 
            dtd
        );
        app_hotpot.test_count += 1;
        // console.log('* app_hotpot.test_count:', app_hotpot.test_count, entry.name);
    }
}

async function fs_read_txt_file_handle(fh, dtd) {
    if (typeof(dtd) == 'undefined') {
        dtd = {name: ''};
    }
    // if (typeof(enabled_sentences) == 'undefined') {
    //     enabled_sentences = false;
    // }
    const file = await fh.getFile();
    const text = await file.text();

    // create ann
    var ann = ann_parser.txt2ann(text, dtd);

    // bind the fh
    ann._fh = fh;

    // bind the filename seperately
    ann._filename = fh.name;

    // bind a status
    ann._has_saved = true;

    // bind the sentences variable
    ann._sentences = [];
    ann._sentences_text = '';
    // if (enabled_sentences) {
    //     var result = nlp_toolkit.sent_tokenize(ann.text);
    //     ann._sentences = result.sentences;
    //     ann._sentences_text = result.sentences_text;
    // } else {
    //     ann._sentences = null;
    //     ann._sentences_text = null;
    // }

    return ann;
}

async function fs_read_ann_file_handle(fh, dtd) {
    // if (typeof(enabled_sentences) == 'undefined') {
    //     enabled_sentences = true;
    // }
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
    ann._sentences = null;
    ann._sentences_text = null;
    // if (enabled_sentences) {
    //     var result = nlp_toolkit.sent_tokenize(ann.text);
    //     ann._sentences = result.sentences;
    //     ann._sentences_text = result.sentences_text;
    // } else {
    //     ann._sentences = null;
    //     ann._sentences_text = null;
    // }

    return ann;
}
