var nlp_toolkit = {
    sent_tlb_syms: ' `!@#$%^&*()_+-=[]{}|\\:";\'<>?,/',
    sentencize_exceptions: new Set([
        // time
        'a.m.',
        'p.m.',
        'mon.',
        'tue.',
        'wed.',
        'thu.',
        'fri.',
        'sat.',
        'sun.',
        'jan.',
        'feb.',
        'mar.',
        'apr.',
        'jun.',
        'jul.',
        'aug.',
        'sep.',
        'oct.',
        'nov.',
        'dec.',

        // geo
        'ark.',
        'ala.',
        'ariz.',
        'calif.',
        'colo.',
        'conn.',
        'fla.',
        'ga.',
        'ia.',
        'id.',
        'ill.',
        'ind.',
        'kan.',
        'kans.',
        'ky.',
        'mass.',
        'n.c.',
        'n.d.',
        'n.h.',
        'n.j.',
        'n.m.',
        'n.y.',
        'neb.',
        'nebr.',
        'nev.',
        'okla.',
        'ore.',
        'pa.',
        's.c.',
        'tenn.',
        'va.',
        'wash.',
        'wis.',
        'd.c.',

        // title and names
        'jr.',
        'st.',
        'mr.',
        'mrs.',
        'ms.',
        'dr.',
        'm.d.',
        'ph.d.',
        'prof.',
        'bros.',
        'adm.',

        // other
        '#.',
        'no.',
        'e.g.',
        'ie.',
        'i.e.',
        'inc.',
        'ltd.',
        'co.',
        'corp.',
        'vs.',
        'v.s.',
        'gov.',
        'gen.',
        'n.e.r.v.', // EVANGELION ! :)
    ]),

    sent_tokenize: function(text, backend) {
        if (typeof(backend) == 'undefined') {
            backend = 'simpledot';
        }
        // console.log('* sentencizing text by ' + backend);

        if (backend == 'simpledot') {
            // return this.sent_tokenize_by_simpledot(text);
            return this.sent_tokenize_by_simpledot_v2(text);
        }

        // if (backend == 'compromise') {
        //     return this.sent_tokenize_by_compromise(text);
        // }

        if (backend == 'wink_nlp') {
            return this.sent_tokenize_by_wink_nlp(text);
        }

        throw {
            name: 'Not found backend',
            message: "The backend is not valid."
        }
    },

    tokenize_by_wink_nlp: function(text) {

    },

    /**
     * Convert the spans to the token index
     * 
     * The item in the list of tags need to contain the following:
     * {
     *     name: 'NAME', // the name this tags, e.g., LOC, PER, GEO
     *     span: [1, 2], // the start and end this tag in this sentence
     * }
     * 
     * So, the text of the tag is not required.
     * After processing, this will return a list:
     * [{
     *     token: 'TOKEN TEXT', // the text of this token
     *     span: [1, 2],        // the start and end of this token
     *     label: 'B-LOC'       // the BIO label, e.g., B-X, I-X, O
     * }, ...]
     * 
     * If any pre-processing is needed, please do it before calling.
     * 
     * @param {string} sentence just a sentence text
     * @param {list} tags list of tags
     * 
     * @returns {list} the list of token position and labels
     */
    convert_span_to_bio_by_wink_nlp: function(sentence, tags) {
        // first, convert the sentence to tokens
        var doc = wink_nlp.readDoc(sentence);
        var tokens = doc.tokens().out();
        
        // then search each token and get the position
        var idx = 0; 
        var pos = []; 
        for (let i=0; i<tokens.length; i++) {
            const token = tokens[i];
            var ia = sentence.indexOf(token);
            var tp = 1;
            while(true) {
                if (ia >= idx) {
                    pos.push({
                        token: token,
                        span: [ia, ia + token.length],
                        // the default label is just O
                        label: 'O'
                    })
                    idx = ia + token.length;
                    break;
                } else {
                    ia = sentence.indexOf(token, tp);
                    tp += 1;
                }
            }
        }
        
        // ok, let's check each token pos
        // make a copy of tags
        var tgs = JSON.parse(JSON.stringify(tags));
        for (let i=0; i<pos.length; i++) {
            // the simplest is just check all tags
            for (let j=0; j<tgs.length; j++) {
                if (i==4) {
                    console.log("j=" +j + ': '+ tgs[j].span + ' vs ' + pos[i].span);
                }
                if (this.is_overlapped(tgs[j].span, pos[i].span)) {
                    if (tgs[j].hasOwnProperty('_has_met')) {
                        pos[i].label = 'I-' + tgs[j].name;
                    } else {
                        pos[i].label = 'B-' + tgs[j].name;
                        tgs[j]._has_met = true;
                    }
                    break;
                }
            }
        }
        
        return pos;
    },

    sent_tokenize_by_wink_nlp: function(text) {
        var doc = wink_nlp.readDoc(text);
        var raw_sentences = doc.sentences().out();

        // for get the spans correctly
        // and the value is the last appearance
        var sentences_dict = {};
        // get all sentences and spans
        var sentences = [];
        // get all sentence trimed text
        var sentences_text = [];

        for (let idx=0; idx<raw_sentences.length; idx++) {
            // get this sentence
            var sentence = raw_sentences[idx];
            var spans_start = text.indexOf(sentence);

            // TODO fix the multiple same sentence bug
            if (sentences_dict.hasOwnProperty(sentence)) {
                // which means this is a duplicated 
                var i = 1;
                var cnt = 0;
                while(true) {
                    spans_start = text.indexOf(sentence, i);

                    if (sentences_dict[sentence] == spans_start) {
                        // which means this sentence appeared
                        i += 1;
                        cnt += 1;

                    } else {
                        // which means this span start is a new one
                        sentences_dict[sentence] = spans_start;
                        break;
                    }
                }

            } else {
                // ok, just add this new sentence
                sentences_dict[sentence] = spans_start;
            }
            var spans_end = spans_start + sentence.length;

            // sometimes the sentence has right blanks
            // we need to remove it to avoid unexpected linebreaks
            sentence = sentence.trimRight();

            sentences.push({
                text: sentence, 
                spans: {
                    start: spans_start, 
                    end: spans_end
                }
            });
            sentences_text.push(sentence);
        };

        return { 
            sentences: sentences,
            sentences_text: sentences_text.join('\n')
        };
    },

    /**
     * Sentencize a given text by a simple method
     * @param {String} text the content to be sentencized
     * @returns Object of sentences
     */
    sent_tokenize_by_simpledot: function(text) {
        // get all sentences and spans
        var sentences = [];

        // get all sentence trimed text
        var sentences_text = [];

        // a temp sentence
        var sentence = [];

        // locate the sentence start
        var spans_start = 0;

        // locate the sentence end
        var spans_end = 0;
        
        // flag for a sentence end
        var flag_sent = false;

        for (let i = 0; i < text.length; i++) {
            // get the current char
            const c = text[i];

            // set the end to current char
            spans_end = i;
            
            // before checking, set the flag to false
            flag_sent = false;

            // detect if this is a sentence break
            if (c == '.') {
                // but there are some corner cases
                if (i+1 < text.length && text[i+1].trim() != '') {
                    // which means next char is not empty
                    // this dot is not for a sentence
                    sentence.push(c);

                } else {
                    // this is an end of sentence
                    flag_sent = true;
                    // collect the char
                    sentence.push(c);
                }
                
            } else if ( c == '?' || c == '!' || c == ';') {
                flag_sent = true;
                // collect the char
                sentence.push(c);
    
            } else if ( c == '\n') {
                flag_sent = true;
                // no need to collect
                // sentence.push(c);

            } else {
                // collect the char
                sentence.push(c);
            }

            if (flag_sent) {
                // ok, this is a sentence.
                var _sentence = sentence.join('');

                // clear the collection
                sentence = [];

                // create a new sentence obj
                sentences.push({
                    text: _sentence, 
                    spans: {
                        start: spans_start, 
                        end: spans_end
                    }
                });

                // put the text
                sentences_text.push(_sentence);

                // move the spans_start to spans_end
                spans_start = spans_end + 1;
            }
        }

        // ok, let's check if the sentence collection is empty
        if (sentence.length > 0) {
            // there is a last sentence
            var _sentence = sentence.join('');

            // create a new sentence obj
            sentences.push({
                text: _sentence, 
                spans: {
                    start: spans_start, 
                    end: spans_end
                }
            });

            // put the text
            sentences_text.push(_sentence);
        }

        return { 
            sentences: sentences,
            sentences_text: sentences_text.join('\n')
        };
    },



    /**
     * Sentencize a given text by a simple method v2
     * @param {String} text the content to be sentencized
     * @returns Object of sentences
     */
    sent_tokenize_by_simpledot_v2: function(text, cfg) {
        if (typeof(cfg) == 'undefined') {
            cfg = {}
        }
        // get all sentences and spans
        var sentences = [];

        // get all sentence trimed text
        var sentences_text = [];

        // a temp sentence
        var sentence = [];

        // locate the sentence start
        var spans_start = 0;

        // locate the sentence end
        var spans_end = 0;
        
        // flag for a sentence end
        var flag_sent = false;

        for (let i = 0; i < text.length; i++) {
            // get the current char
            const c = text[i];

            // set the end to current char
            spans_end = i;
            
            // before checking, set the flag to false
            flag_sent = false;

            // detect if this is a sentence break
            // a fake loop for quick break
            // searching for spans_end
            while(1) {
                if (c == '.') {
                    // but there are some corner cases
                    if (i+1 < text.length && text[i+1].trim() != '') {
                        // 1. this case is simple.
                        // which means next char is not empty
                        // this dot is not for a sentence
                        // for example: 192.168.1.200 
                        // this is an IP, not four sentences
                        sentence.push(c);
                        break;

                    } 
                    // look back the whole token
                    var dot_token_start = i;
                    for (let bi = i-1; bi >= 0; bi--) {
                        if (this.sent_tlb_syms.includes(text[bi])) {
                            // ok, we found the break of a token
                            dot_token_start = bi + 1;
                            break;
                        }
                    }
                    // get the token with dot, for example:
                    // 
                    // 0123456789................
                    // when Mr. Anderson wakes up,
                    //     b^ i 
                    // 
                    // the c is at 7,
                    // the bi will find 4,
                    // the dot_token_start ^ will be 5
                    // then the dot_token is Mr.
                    var dot_token = text.substring(
                        dot_token_start,
                        i+1
                    );
                    var dot_token_lower = dot_token.toLocaleLowerCase();

                    // now find check this dot token
                    if (this.sentencize_exceptions.has(dot_token_lower)) {
                        // ok, this token is a special exception
                        // just skip
                        sentence.push(c);
                        break;
                    }
                    
                    // for everthing else
                    // this is an end of sentence
                    flag_sent = true;
                    // collect the char
                    sentence.push(c);
                    break;
                    
                } else if ( c == '?' || c == '!' || c == ';') {
                    flag_sent = true;
                    // collect the char
                    sentence.push(c);
                    break;
        
                } else if ( c == '\n') {
                    flag_sent = true;
                    // no need to collect
                    // sentence.push(c);
                    break;

                } else {
                    // collect the char
                    sentence.push(c);
                    break;
                }
            }

            if (flag_sent) {
                // ok, this is a sentence.
                var _sentence = sentence.join('');

                // clear the collection
                sentence = [];

                // create a new sentence obj
                sentences.push({
                    text: _sentence, 
                    spans: {
                        start: spans_start, 
                        end: spans_end
                    }
                });

                // put the text
                sentences_text.push(_sentence);

                // move the spans_start to spans_end for temp location
                spans_start = spans_end + 1;
            }
        }

        // ok, let's check if the sentence collection is empty
        if (sentence.length > 0) {
            // there is a last sentence
            var _sentence = sentence.join('');

            // create a new sentence obj
            sentences.push({
                text: _sentence, 
                spans: {
                    start: spans_start, 
                    end: spans_end
                }
            });

            // put the text
            sentences_text.push(_sentence);
        }

        return { 
            sentences: sentences,
            sentences_text: sentences_text.join('\n')
        };
    },



    /**
     * Sentencize a given text by a simple method v3
     * @param {String} text the content to be sentencized
     * @returns Object of sentences
     */
    sent_tokenize_by_simpledot_v3: function(text, cfg) {
        if (typeof(cfg) == 'undefined') {
            cfg = {}
        }
        // get all sentences and spans
        var sentences = [];

        // get all sentence trimed text
        var sentences_text = [];

        // a temp sentence
        var sentence = [];

        // locate the sentence start
        var spans_start = 0;

        // locate the sentence end
        var spans_end = 0;
        
        // flag for a sentence end
        var flag_sent = false;

        // flag for searching sentence start
        var flag_sfss = false;

        for (let i = 0; i < text.length; i++) {
            // get the current char
            const c = text[i];

            // set the end to current char
            spans_end = i;
            
            // before checking, set the flag to false
            flag_sent = false;

            // detect if this is a sentence break
            // a fake loop for quick break
            if (flag_sfss) {
                // searching for spans_start
                if (c == ' ') {
                    // event it's blank, just move the start
                    spans_start = i;
                } else {
                    // if non-white space char,
                    // it's a sentence
                    flag_sfss = false;
                    spans_start = i;
                    sentence.push(c);
                }

            } else {
                // searching for spans_end
                while(1) {
                    if (c == '.') {
                        // but there are some corner cases
                        if (i+1 < text.length && text[i+1].trim() != '') {
                            // 1. this case is simple.
                            // which means next char is not empty
                            // this dot is not for a sentence
                            // for example: 192.168.1.200 
                            // this is an IP, not four sentences
                            sentence.push(c);
                            break;
    
                        } 
                        // look back the whole token
                        var dot_token_start = i;
                        for (let bi = i-1; bi >= 0; bi--) {
                            if (this.sent_tlb_syms.includes(text[bi])) {
                                // ok, we found the break of a token
                                dot_token_start = bi + 1;
                                break;
                            }
                        }
                        // get the token with dot, for example:
                        // 
                        // 0123456789................
                        // when Mr. Anderson wakes up,
                        //     b^ i 
                        // 
                        // the c is at 7,
                        // the bi will find 4,
                        // the dot_token_start ^ will be 5
                        // then the dot_token is Mr.
                        var dot_token = text.substring(
                            dot_token_start,
                            i+1
                        );
                        var dot_token_lower = dot_token.toLocaleLowerCase();
    
                        // now find check this dot token
                        if (this.sentencize_exceptions.has(dot_token_lower)) {
                            // ok, this token is a special exception
                            // just skip
                            sentence.push(c);
                            break;
                        }
                        
                        // for everthing else
                        // this is an end of sentence
                        flag_sent = true;
                        // collect the char
                        sentence.push(c);
                        break;
                        
                    } else if ( c == '?' || c == '!' || c == ';') {
                        flag_sent = true;
                        // collect the char
                        sentence.push(c);
                        break;
            
                    } else if ( c == '\n') {
                        flag_sent = true;
                        // no need to collect
                        // sentence.push(c);
                        break;
    
                    } else {
                        // collect the char
                        sentence.push(c);
                        break;
                    }
                }
            }


            if (flag_sent) {
                // ok, this is a sentence.
                var _sentence = sentence.join('');

                // clear the collection
                sentence = [];

                // create a new sentence obj
                sentences.push({
                    text: _sentence, 
                    spans: {
                        start: spans_start, 
                        end: spans_end
                    }
                });

                // put the text
                sentences_text.push(_sentence);

                // move the spans_start to spans_end for temp location
                spans_start = spans_end + 1;
                // set flag for searching start
                flag_sfss = true;
            }
        }

        // ok, let's check if the sentence collection is empty
        if (sentence.length > 0) {
            // there is a last sentence
            var _sentence = sentence.join('');

            // create a new sentence obj
            sentences.push({
                text: _sentence, 
                spans: {
                    start: spans_start, 
                    end: spans_end
                }
            });

            // put the text
            sentences_text.push(_sentence);
        }

        return { 
            sentences: sentences,
            sentences_text: sentences_text.join('\n')
        };
    },


    /**
     * Sentencize a given text by a compromise.cool NLP
     * @param {String} text the content to be sentencized
     * @returns Object of sentences
     */
    sent_tokenize_by_compromise: function(text) {
        // first, convert the raw text to a doc object
        var doc = nlp(text);

        // get all sentences and spans
        var sentences = [];

        // for get the spans correctly
        // and the value is the last appearance
        var sentences_dict = {};

        // get all sentence trimed text
        var sentences_text = [];

        var doc_sentences = doc.sentences().json({
            offset: true
        });

        for (let i = 0; i < doc_sentences.length; i++) {
            const d = doc_sentences[i];
            
            // get this sentence text
            var sentence = d.text;

            // get the offset by compromise.cool NLP
            // thanks to spencer kelly (spencermountain@gmail.com)
            var spans_start = d.offset.start;
            var spans_end = d.offset.start + d.offset.length - 1;

            // to avoid right new line
            sentence = sentence.trimRight();

            // to avoid inline new line
            sentence = sentence.replaceAll('\n', ' ');
            sentence = sentence.replaceAll('\r', ' ');

            // save this sentence
            sentences.push({
                text: sentence, 
                spans: {
                    start: spans_start, 
                    end: spans_end
                }
            });
            sentences_text.push(sentence);
        }

        // doc.sentences().forEach(function(d) {
        //     // get this sentence
        //     var sentence = d.text();
        //     var spans_start = text.indexOf(sentence);

        //     // TODO fix the multiple same sentence bug
        //     if (sentences_dict.hasOwnProperty(sentence)) {
        //         // which means this is a duplicated 
        //         var i = 1;
        //         var cnt = 0;
        //         while(true) {
        //             spans_start = text.indexOf(sentence, i);

        //             if (sentences_dict[sentence] == spans_start) {
        //                 // which means this sentence appeared
        //                 i += 1;
        //                 cnt += 1;

        //             } else {
        //                 // which means this span start is a new one
        //                 sentences_dict[sentence] = spans_start;
        //                 break;
        //             }
        //         }

        //     } else {
        //         // ok, just add this new sentence
        //         sentences_dict[sentence] = spans_start;
        //     }
        //     var spans_end = spans_start + sentence.length;

        //     // sometimes the sentence has right blanks
        //     // we need to remove it to avoid unexpected linebreaks
        //     sentence = sentence.trimRight();

        //     sentences.push({
        //         text: sentence, 
        //         spans: {
        //             start: spans_start, 
        //             end: spans_end
        //         }
        //     });
        //     sentences_text.push(sentence);
        // });

        return { 
            sentences: sentences,
            sentences_text: sentences_text.join('\n')
        };
    },

    find_linech: function(pos, sentences) {
        for (let i = 0; i < sentences.length; i++) {
            const sentence = sentences[i];
            if (pos>=sentence.spans.start &&
                pos<=sentence.spans.end) {
                return {
                    line: i, 
                    ch: pos-sentence.spans.start
                };
            }
        }
        return null;
    },

    is_sub: function(loc_area, loc_sub) {
        if (loc_area[0] <= loc_sub[0] &&
            loc_area[1] >= loc_sub[1]) {
            return true;
        }
        return false;
    },

    is_overlapped: function(a, b) {
        if (a[0] >= b[0] && a[0] < b[1]) {
            return true;
        }
        if (a[1] > b[0] && a[1] <= b[1]) {
            return true;
        }
        if (a[0] <= b[0] && a[1] >= b[1]) {
            return true;
        }
        return false;
    },

    is_overlapped_in_list: function(loc_x, loc_list) {
        for (let i = 0; i < loc_list.length; i++) {
            const loc = loc_list[i];
            if (this.is_overlapped(loc_x, loc)) {
                return true;
            }
        }
        return false;
    },

    update_tag_locs_offset: function(locs, offset) {
        for (let i = 0; i < locs.length; i++) {
            locs[i][0] -= offset;
            locs[i][1] -= offset;
        }
        return locs;
    },

    download_text_tsv: function(anns, dtd, hint_dict, fn) {
        // convert the hint dict to a json obj
        var json = [];

        for (const tag_name in hint_dict) {
            if (Object.hasOwnProperty.call(hint_dict, tag_name)) {
                const tag_dict = hint_dict[tag_name];
                
                for (const tag_text in tag_dict.text_dict) {
                    if (Object.hasOwnProperty.call(tag_dict.text_dict, tag_text)) {
                        const tag = tag_dict.text_dict[tag_text];
                        
                        json.push({
                            tag: tag_name,
                            text: tag_text,
                            count: tag.count
                        });
                    }
                }

                // the nc tag
                for (const fn in tag_dict.nc_dict.ann_fn_dict) {
                    if (Object.hasOwnProperty.call(tag_dict.nc_dict.ann_fn_dict, fn)) {
                        const count = tag_dict.nc_dict.ann_fn_dict[fn];
                        
                        json.push({
                            tag: tag_name,
                            text: fn,
                            count: count
                        });
                    }
                }
            }
        }

        // then convert the json to csv
        var tsv = Papa.unparse(json, {
            delimiter: '\t'
        });

        // download this tsv
        var blob = new Blob([tsv], {type: "text/tsv;charset=utf-8"});
        saveAs(blob, fn);

        return tsv;
    },


    download_sentence_tsv: function(anns, dtd, fn) {
        // convert the hint dict to a json obj
        var json = [];

        for (let i = 0; i < anns.length; i++) {
            var ann = anns[i];

            // fix the sentence
            ann = app_hotpot.update_ann_sentences(ann);

            for (let j = 0; j < ann.tags.length; j++) {
                const tag = ann.tags[j];
                // now mapping the span to token index
                if (!tag.hasOwnProperty('spans')) {
                    // this is not an entity tag
                    continue;
                }
                // there maybe multiple spans
                var locs = ann_parser.spans2locs(tag.spans);

                for (let k = 0; k < locs.length; k++) {
                    // const _span = spans[k];
                    // const span = nlp_toolkit.txt2span(_span);
                    const span = locs[k];
                    if (span[0] == -1 || span[1] == -1) {
                        // which means this tag is just a non-consuming tag
                        // at present, we won't use this kind of tag 
                        continue;
                    }

                    // find the offset in a sentence
                    var loc0 = this.find_linech(
                        span[0], 
                        ann._sentences
                    );
                    if (loc0 == null) {
                        // something wrong?
                        continue;
                    }
                    // find the location for the right part
                    // var loc1 = this.find_linech(span[1], ann._sentences);
                    var loc1 = Object.assign({}, loc0);
                    loc1.ch += (span[1] - span[0]);

                    // create a new row/item in the output data
                    json.push({
                        concept: tag.tag,
                        text: tag.text,
                        doc_span: span,
                        sen_span: [
                            loc0.ch,
                            loc1.ch
                        ],
                        document: ann._filename,
                        sentence: ann._sentences[loc0.line].text
                    });
                }
            }
        }

        // then convert the json to tsv
        var tsv = Papa.unparse(json, {
            delimiter: '\t'
        });

        // download this tsv
        var blob = new Blob([tsv], {type: "text/tsv;charset=utf-8"});
        saveAs(blob, fn);

        return tsv;
    },

    /**
     * Download the anns as raw XML format
     * @param {list} anns the list of ann objects
     * @param {object} dtd the dtd schema
     * @param {string} fn the download filename
     */
    download_dataset_raw: function(anns, dtd, fn, skip_dtd) {
        if (typeof(skip_dtd)=='undefined') {
            // by default, we don't need the dtd file to be included
            skip_dtd = true;
        }

        // create an empty zip pack
        var zip = new JSZip();
        var file_list = [];

        // put the dtd
        if (skip_dtd) {

        } else {
            // add the dtd content if exists
            if (dtd.hasOwnProperty('text')) {
                var dtd_fn = dtd.name + '.dtd';
                zip.file(dtd_fn, dtd.text);
                file_list.push(dtd.name + '.dtd');
            }
        }

        // create a folder in this zip file
        // var folder_name = 'annotation-'+ dtd.name + '';
        // use the given filename as the folder name (exclude the .zip)
        var folder_name = fn.substring(0, fn.lastIndexOf('.'));

        // check each ann file
        for (let i = 0; i < anns.length; i++) {
            const ann = anns[i];
            
            // convert to xml first
            var xmlDoc = ann_parser.ann2xml(ann, dtd);

            // convert xml to string
            var xmlStr = ann_parser.xml2str(xmlDoc, false);

            // get the filename of this annotation
            var ann_fn = ann._filename;

            // get the file
            // add the text dataset to zip
            var full_fn = folder_name + '/' + ann_fn;
            zip.file(full_fn, xmlStr);
            file_list.push(full_fn);
        }

        // create zip file
        zip.generateAsync({ type: "blob" }).then((function(fn) {
            return function (content) {
                saveAs(content, fn);
            }
        })(fn));

        return file_list.join('\n');
    },

    /**
     * Download the BIO format dataset
     * 
     * @param {list} anns the list of ann object
     * @param {object} dtd the dtd schema
     */
    download_dataset_bio: function(anns, dtd, fn, ratios, skip_non_tags_sentence) {
        if (typeof(ratios)=='undefined') {
            ratios = [0.8, 0.1, 0.1];
        }
        if (typeof(skip_non_tags_sentence)=='undefined') {
            skip_non_tags_sentence = true;
        }
        // first, create the dataset itself
        var ann_sentence_tags = {};

        // check each tag
        for (let i = 0; i < anns.length; i++) {
            var ann = anns[i];

            // 2022-08-10: the sentence may not be not ready 
            // when converting, fix the sentences
            ann = app_hotpot.update_ann_sentences(ann);

            var sentence_tags = {};
            for (let j = 0; j < ann.tags.length; j++) {
                const tag = ann.tags[j];

                // now mapping the span to token index
                if (!tag.hasOwnProperty('spans')) {
                    // this is not an entity tag
                    continue;
                }
                
                var spans = tag.spans.split(',');
                for (let k = 0; k < spans.length; k++) {
                    const _span = spans[k];

                    const span = this.txt2span(_span);
                    if (span[0] == -1 || spans[1] == -1) {
                        // which means this tag is just a non-consuming tag
                        // at present, we won't use this kind of tag when
                        // exporting the BIO
                        continue;
                    }
                    // find the offset in a sentence
                    var loc0 = this.find_linech(span[0], ann._sentences);
                    if (loc0 == null) {
                        // something wrong?
                        continue;
                    }

                    // find the location for the right part
                    // var loc1 = this.find_linech(span[1], ann._sentences);
                    var loc1 = Object.assign({}, loc0);
                    loc1.ch += (span[1] - span[0]);

                    if (!sentence_tags.hasOwnProperty(loc0.line)) {
                        sentence_tags[loc0.line] = {
                            sentence: ann._sentences[loc0.line],
                            tags: []
                        }
                    }

                    // put this tag for this line
                    sentence_tags[loc0.line].tags.push({
                        name: tag.tag,
                        span: [
                            loc0.ch,
                            loc1.ch
                        ],
                        // if k>0, which means this span is a multi location tag
                        force_label_i: k != 0
                    });
                }
            }
            ann_sentence_tags[i] = sentence_tags;
        }

        // now, we need to convert each sentence to 
        // the BIO format
        var bios_all = [];
        for (const ann_idx in ann_sentence_tags) {
            if (Object.hasOwnProperty.call(ann_sentence_tags, ann_idx)) {
                const sentence_tags = ann_sentence_tags[ann_idx];
                for (const sent_idx in sentence_tags) {
                    if (Object.hasOwnProperty.call(sentence_tags, sent_idx)) {
                        if (sentence_tags[sent_idx].tags.length == 0) {
                            if (skip_non_tags_sentence) {
                                continue;
                            }
                        };
                        
                        var labeled_tokens = this.convert_span_to_bio_by_wink_nlp(
                            sentence_tags[sent_idx].sentence.text,
                            sentence_tags[sent_idx].tags
                        );
        
                        bios_all.push(labeled_tokens);
                    }
                }
            }
        }
        // split into train, dev, test
        var [bios_train, bios_dt] = ds_spliter(bios_all, ratios[0]);
        var [bios_dev, bios_test] = ds_spliter(bios_dt, ratios[1] / (ratios[1] + ratios[2]));

        // create a help function for converting
        function bios2text(bios) {
            var txt_ds = [];
            var txt_lb = {};

            for (let i = 0; i < bios.length; i++) {
                const labeled_tokens = bios[i];
                for (let j = 0; j < labeled_tokens.length; j++) {
                    const item = labeled_tokens[j];
                    txt_ds.push(
                        item.token + '\t' + item.label
                    );
                    txt_lb[item.label] = 1;
                }
                // add a blank line after each sentence
                txt_ds.push('');
            }
            return [txt_ds, txt_lb];
        }

        // merge into text
        var [txt_dataset, txt_labels] = bios2text(bios_all);
        var [txt_train, _] = bios2text(bios_train);
        var [txt_dev, _] = bios2text(bios_dev);
        var [txt_test, _] = bios2text(bios_test);
        
        // convert text arr to pure string
        txt_dataset = txt_dataset.join('\n');
        txt_train = txt_train.join('\n');
        txt_dev = txt_dev.join('\n');
        txt_test = txt_test.join('\n');
        txt_labels = Object.keys(txt_labels).sort().join('\n');

        // last, create a zip file, which contains
        // create an empty zip pack
        var zip = new JSZip();
        var folder_name = 'dataset-'+ dtd.name + '-BIO';

        // add the text dataset to zip
        zip.file(folder_name + '/dataset.tsv', txt_dataset);
        // add the label to zip
        zip.file(folder_name + '/labels.tsv', txt_labels);
        // add the splited to zip
        zip.file(folder_name + '/train.tsv', txt_train);
        zip.file(folder_name + '/dev.tsv', txt_dev);
        zip.file(folder_name + '/test.tsv', txt_test);

        // create zip file
        zip.generateAsync({ type: "blob" }).then((function(fn) {
            return function (content) {
                saveAs(content, fn);
            }
        })(fn));

        return txt_dataset;
    },

    txt2span: function(txt) {
        var ps = txt.split('~');
        return [
            parseInt(ps[0]),
            parseInt(ps[1])
        ]
    },

    /**
     * Get the sentence offset of a given spans in document's sentences
     * 
     * @param {string} spans offsets in a document, like 123~124
     * @param {list} sentences a list of `sentence` {spans: {start:, end:}, text:''}
     * @returns a list of possible locations
     */
    get_sen_span: function(spans, sentences) {
        var locs = ann_parser.spans2locs(spans);

        // the ret is a list of results
        var ret = [];

        for (let k = 0; k < locs.length; k++) {
            // const _span = spans[k];
            // const span = nlp_toolkit.txt2span(_span);
            const loc = locs[k];
            if (loc[0] == -1 || loc[1] == -1) {
                // which means this tag is just a non-consuming tag
                // at present, we won't use this kind of tag 
                continue;
            }

            // find the offset in a sentence
            var loc0 = this.find_linech(
                loc[0], 
                sentences
            );
            if (loc0 == null) {
                // something wrong?
                continue;
            }
            // find the location for the right part
            // var loc1 = this.find_linech(span[1], ann._sentences);
            var loc1 = Object.assign({}, loc0);
            loc1.ch += (loc[1] - loc[0]);

            // create a new row/item in the output data
            ret.push({
                doc_span: loc,
                sen_span: [
                    loc0.ch,
                    loc1.ch
                ],
                sentence: sentences[loc0.line].text
            });
        }

        return ret;
    }

};