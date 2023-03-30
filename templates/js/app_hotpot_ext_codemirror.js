/**
 * This is an extension for code mirror related functions 
 */

Object.assign(app_hotpot, {
    cm_init: function() {
        // init the code mirror instance
        this.codemirror = CodeMirror(
            document.getElementById('cm_editor'), {
                lineNumbers: true,
                lineWrapping: true,
                readOnly: true,
                // readOnly: 'nocursor',
                // styleActiveLine: true,
                extraKeys: {"Alt-F": "find"}
            }
        );

        this.codemirror.on('contextmenu', function(inst, evt) {
            evt.preventDefault();

            // update the selection texts
            var selection = app_hotpot.cm_get_selection(inst);
            if (selection.sel_txts == '') {
                // if there is/are non-consuming tags
                // which makes it a document-level annotation
                // show the menu here
                if (app_hotpot.vpp.get_nc_etags().length>0) {
                    // show
                    var mouseX = evt.clientX;
                    var mouseY = evt.clientY;
                    app_hotpot.show_nce_ctxmenu(mouseX, mouseY);
                    return;

                } else {
                    // nothing selected and there is no NC etag
                    return;
                }

            }
            // show the menu
            var mouseX = evt.clientX;
            var mouseY = evt.clientY;
            app_hotpot.show_tag_ctxmenu(mouseX, mouseY);
        });
    },

    cm_set_ann: function(ann) {
        // make sure all clear
        // clear all etag markers
        this.cm_clear_etag_marks();

        // clear all link tags
        this.cm_clear_rtag_marks();

        // first, if ann is null, just remove everything in the editor
        if (ann == null) {
            this.codemirror.setValue('');
            return;
        }

        // if the current mode is 
        if (this.vpp.$data.cm.display_mode == 'document') {
            this.codemirror.setValue(
                ann.text
            );

        } else if (this.vpp.$data.cm.display_mode == 'sentences') {
            // update the sentences if not available
            if (ann._sentences_text == '') {
                ann = app_hotpot.update_ann_sentences(ann);
            }
            this.codemirror.setValue(
                ann._sentences_text
            );
        } else {
            this.codemirror.setValue('');
        }
    },

    cm_get_selection: function(inst) {
        if (typeof(inst) == 'undefined') {
            inst = this.codemirror;
        }
        // update the selection
        var selection = {
            sel_txts: inst.getSelections(),
            sel_locs: inst.listSelections()
        };
        this.selection = selection;
        // console.log("* found selection:", app_hotpot.selection);
        return selection;
    },

    cm_clear_selection: function(to_anchor=true) {
        var new_anchor = null;
        if (to_anchor) {
            new_anchor = this.selection.sel_locs[0].anchor;
        } else {
            new_anchor = this.selection.sel_locs[0].head;
        }
        this.codemirror.setSelection(new_anchor);
    },

    cm_make_basic_etag_from_selection: function() {
        var locs = [];
        var txts = [];

        // usually there is only one tag
        for (let i = 0; i < app_hotpot.selection.sel_locs.length; i++) {
            var sel_loc = app_hotpot.selection.sel_locs[i];
            var sel_txt = app_hotpot.selection.sel_txts[i];
            locs.push(
                app_hotpot.cm_range2spans(
                    sel_loc, 
                    this.vpp.$data.anns[this.vpp.$data.ann_idx]
                )
            );
            txts.push(sel_txt);
        }
        
        // now push new ann tag
        var tag = {
            'spans': locs.join(','),
            'text': txts.join(' ... ')
        };

        return tag;
    },

    cm_update_marks: function() {
        // clear all etag markers
        this.cm_clear_etag_marks();

        // clear all link tags
        this.cm_clear_rtag_marks();

        // update the hint marks
        this.cm_update_hint_marks();

        // update the tag marks
        this.cm_update_tag_marks();

        // force update UI, well ... maybe not work
        // this.vpp.$forceUpdate();

        console.log('* updated cm marks');
    },

    cm_clear_etag_marks: function() {
        var marks = this.codemirror.getAllMarks();
        for (let i = marks.length - 1; i >= 0; i--) {
            marks[i].clear();
        }
        console.log()
    },

    cm_clear_rtag_marks: function() {
        // first, check if there is a layer for the plots
        if ($('#cm_svg_plots').length == 0) {
            $('.CodeMirror-sizer').prepend(`
            <div class="CodeMirror-plots">
            <svg id="cm_svg_plots">
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
                        markerWidth="6" markerHeight="6"
                        orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" />
                    </marker>
                </defs>
            </svg>
            </div>
        `);
        } else {
            $('#cm_svg_plots').html(`
                <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5"
                        markerWidth="6" markerHeight="6"
                        orient="auto-start-reverse">
                        <path d="M 0 0 L 10 5 L 0 10 z" />
                    </marker>
                </defs>
            `);
        }
    },

    cm_update_hint_marks: function() {
        if (this.vpp.$data.ann_idx == null) {
            // nothing to do for empty
            return;
        }

        if (!this.vpp.$data.cm.enabled_hints ||
            this.vpp.$data.cm.hint_mode == 'off') {
            // nothing to do when turn off hint
            return;
        }

        if (this.vpp.$data.dtd == null) {
            // nothing to do if no dtd given
            return;
        }

        var focus_tags = null;
        if (app_hotpot.vpp.is_render_tags_of_all_concepts()) {

        } else {
            if (this.vpp.$data.display_tag_name == '__all__') {
                // search all tag
            } else {
                // ok, only search this tag
                focus_tags = [ this.vpp.$data.display_tag_name ];
            }
        }

        // find markable hints for this ann
        var hints = ann_parser.search_hints_in_ann(
            this.vpp.hint_dict,
            this.vpp.$data.anns[this.vpp.$data.ann_idx],
            focus_tags
        );
        console.log('* found hints', hints);

        // bind the hints to vpp
        this.vpp.$data.hints = hints;

        this.cm_mark_hints(hints);
    },

    cm_update_tag_marks: function() {
        const start = performance.now();
        if (this.vpp.$data.ann_idx == null) {
            // nothing to do for empty
            return;
        }

        // to ensure the link tag could be draw correctly,
        // draw the etags first
        this.cm_update_etag_marks();

        // since all etags have been rendered,
        // it's safe to render the link tags
        this.cm_update_rtag_marks();
        const duration = performance.now() - start;
        console.log('* marked tags in', duration);
    },

    cm_update_etag_marks: function() {
        const start = performance.now();
        if (this.vpp.$data.ann_idx == null) {
            // nothing to do for empty
            return;
        }

        // update the new marks
        var working_ann = this.vpp.$data.anns[this.vpp.$data.ann_idx];
        for (let i = 0; i < working_ann.tags.length; i++) {
            var tag = working_ann.tags[i];
            var tag_def = this.vpp.get_tag_def(tag.tag);
            if (tag_def.type == 'etag') {
                var ret = this.cm_mark_ann_etag_in_text(
                    tag, 
                    tag_def, 
                    working_ann
                );
                // console.log('* finished rendering', ret, tag);
            }
        }
        const duration = performance.now() - start;
        console.log('* marked etags in', duration);
    },

    cm_update_rtag_marks: function() {
        if (this.vpp.$data.ann_idx == null) {
            // nothing to do for empty
            return;
        }
        if (this.vpp.$data.cm.enabled_links) {
            // ok! show links
        } else {
            // well, if user doesn't want to show links,
            // it's ok
            return;
        }

        // update the new marks
        var working_ann = this.vpp.$data.anns[this.vpp.$data.ann_idx];
        for (let i = 0; i < working_ann.tags.length; i++) {
            var tag = working_ann.tags[i];
            var tag_def = this.vpp.get_tag_def(tag.tag);
            if (tag_def.type == 'rtag') {
                this.cm_mark_ann_rtag_in_text(tag, tag_def, working_ann);
            }
        }
    },

    cm_mark_hints: function(hints) {
        const start = performance.now();
        for (let i = 0; i < hints.length; i++) {
            const hint = hints[i];
            // console.log('* rendering hint', hint);
            this.cm_mark_hint_in_ann(
                hint,
                this.vpp.$data.anns[this.vpp.$data.ann_idx]
            );
        }
        const duration = performance.now() - start;
        console.log('* marked hints in', duration);
    },

    /**
     * Mark the hint in the code mirror
     * @param {object} hint it contains the range for rendering
     */
     cm_mark_hint_in_ann: function(hint, ann) {
        var range = this.cm_spans2range(hint.spans, ann);
        // console.log("* marking hint", hint, 'on', range);

        // a hover message
        var descr = [
            "" + hint.tag
        ].join('\n');
        
        if (this.vpp.$data.cm.mark_mode == 'node') {
            var hint_tag_id_prefix = dtd_parser.get_id_prefix(
                hint.tag, 
                this.vpp.$data.dtd
            );
            var markHTML = [
                '<span class="mark-hint mark-hint-'+hint.tag+'" id="mark-id-'+hint.id+'" onclick="app_hotpot.vpp.add_tag_by_hint(\''+hint.id+'\')" title="Click to add this to tags" data-descr="'+descr+'">',
                '<span class="mark-hint-info mark-tag-'+hint.tag+'">',
                    hint_tag_id_prefix,
                '</span>',
                '<span class="mark-hint-text" hint_id="'+hint.id+'">',
                    hint.text,
                '</span>',
                '</span>'
            ].join('');

            // convert this HTML to DOMElement
            var placeholder = document.createElement('div');
            placeholder.innerHTML = markHTML;
            var markNode = placeholder.firstElementChild;

            try {
                this.codemirror.markText(
                    range.anchor,
                    range.head,
                    {
                        className: 'mark-hint mark-hint-' + hint.tag,
                        replacedWith: markNode,
                        attributes: {
                            hint_id: hint.id,
    
                        }
                    }
                );
            } catch (error) {
                // sometimes, replacing DOM node may fail due to
                // Error: Inserting collapsed marker partially overlapping an existing one
                // so, just skip this for now
                console.error("! can't mark conflict hint", hint)
            }
            
        } else if (this.vpp.$data.cm.mark_mode == 'span') {
            
            this.codemirror.markText(
                range.anchor,
                range.head,
                {
                    className: 'mark-hint mark-hint-' + hint.tag,
                    attributes: {
                        hint_id: hint.id,
                        onclick: 'app_hotpot.vpp.add_tag_by_hint(\''+hint.id+'\')',
                        'data-descr': descr
                    }
                }
            );
        }
    },

    cm_mark_ann_tag_in_text: function(tag, tag_def, ann) {
        if (tag_def.type == 'etag') {
            return this.cm_mark_ann_etag_in_text(tag, tag_def, ann);
        } else {
            return this.cm_mark_ann_rtag_in_text(tag, tag_def, ann);
        }
    },

    cm_mark_ann_rtag_in_text: function(tag, tag_def, ann) {
        if (app_hotpot.vpp.is_render_tags_of_all_concepts()) {
            // ok, let's render all tags here
        } else {
            if (app_hotpot.vpp.is_display_tag_name(tag.tag)) {
                // ok
            } else {
                return [-1];
            }
        }

        this.cm_draw_rtag(tag, tag_def, ann);
    },

    cm_mark_ann_etag_in_text: function(tag, tag_def, ann) {
        var raw_spans = tag['spans'];
        // before rendering this tag
        // we need to check whether it should be rendered

        // 1. something wrong with the spans information?
        if (raw_spans == '' || raw_spans == null) { 
            return [-1]; 
        }

        // 2. document-level tag, nothing to do or render differently
        if (raw_spans == dtd_parser.NON_CONSUMING_SPANS) {
            return [-2];
        }

        // 3. is current setting to render all or only selected?
        if (app_hotpot.vpp.is_render_tags_of_all_concepts()) {
            // ok, nothing to worry, just render this tag
        } else {
            // is display this tag by the tag list filter?
            if (app_hotpot.vpp.is_display_tag_name(tag.tag)) {
                // ok
            } else {
                // the second case is quite complex.
                // to render the link tags,
                // the related entity tags are also needed to render
                // so the question is, is this tag belong to current link tag?
                if (app_hotpot.vpp.get_tag_def(app_hotpot.vpp.$data.display_tag_name).type == 'rtag') {
                    // only check this for only showing link tag.
                    // otherwise it will cost unnecessary computation
                    if (app_hotpot.vpp.is_tag_related_to_tag_name(
                        tag, 
                        [app_hotpot.vpp.$data.display_tag_name],
                        app_hotpot.vpp.$data.anns[app_hotpot.vpp.$data.ann_idx]
                    )) {
                        // ok, I don't which one, but it does belong to which link
                        // just goto render

                    } else {
                        // great, no need to render
                        return [-3];
                    }
                } else {
                    // great, no need to render
                    return [-4];
                }
            }
        }

        // the spans may contains multiple parts
        // split them first
        var spans_arr = raw_spans.split(',');
        var text_arr = tag.text.split('...');

        // hover message
        var descr = [
            "" + tag.tag + ' - ' + tag.id,
            "spans: " + tag.spans
        ];
        descr = descr.join('\n');
        
        // render every part of the spans
        for (let i = 0; i < spans_arr.length; i++) {
            const spans = spans_arr[i];
            const spans_text = text_arr[i];
            var range = this.cm_spans2range(spans, ann);

            if (this.vpp.$data.cm.mark_mode == 'node') {
                // the second step is to enhance the mark tag with more info
                var markHTML = [
                    '<span class="mark-tag mark-tag-'+tag.tag+'" '+
                        'id="mark-etag-id-'+tag.id+'" '+
                        'tag_id="'+tag.id+'" '+
                        'data-descr="'+descr+'" '+
                        'onmouseenter="app_hotpot.vpp.on_enter_tag(event)" '+
                        'onmouseleave="app_hotpot.vpp.on_leave_tag(event)">',
                    '<span onclick="app_hotpot.vpp.on_click_editor_tag(event, \''+tag.id+'\')">',
                    '<span class="mark-tag-info">',
                        '<span class="mark-tag-info-inline fg-tag-'+tag.tag+'">',
                        tag.id,
                        '</span>',
                    '</span>',
                    '<span class="mark-tag-text" tag_id="'+tag.id+'">',
                        spans_text,
                    '</span>',
                    '</span>',
                    '<span class="mark-tag-info-offset" title="Delete tag '+tag.id+'" onclick="app_hotpot.delete_tag(\''+tag.id+'\');">',
                        '<i class="fa fa-times-circle"></i>',
                    '</span>',
                    '</span>'
                ].join('');

                // convert this HTML to DOMElement
                var placeholder = document.createElement('div');
                placeholder.innerHTML = markHTML;
                var markNode = placeholder.firstElementChild;

                // add mark to text
                try {
                    this.codemirror.markText(
                        range.anchor,
                        range.head,
                        {
                            className: 'mark-tag mark-tag-' + tag.tag,
                            replacedWith: markNode,
                            attributes: {
                                tag_id: tag.id
                            }
                        }
                    );
                } catch (error) {
                    console.error("! can't mark conflict tag", tag)
                }

            } else if (this.vpp.$data.cm.mark_mode == 'span') {
                this.codemirror.markText(
                    range.anchor,
                    range.head,
                    {
                        className: 'mark-tag mark-tag-' + tag.tag + '',
                        attributes: {
                            id: 'mark-etag-id-' + tag.id,
                            tag_id: tag.id,
                            onclick: 'app_hotpot.vpp.on_click_editor_tag(event, \''+tag.id+'\')',
                            'data-descr': descr,
                            onmouseenter: 'app_hotpot.vpp.on_enter_tag(event)',
                            onmouseleave: 'app_hotpot.vpp.on_leave_tag(event)',
                        }
                    }
                );
                // add a cap of annotator for adjudication
                if (tag.hasOwnProperty('_annotator')) {
                    this.cm_draw_etag_cap(
                        tag, 
                        ann, 
                        tag._annotator.toLocaleUpperCase()
                    );
                }
            }
        }

        return [0];
    },

    cm_jump2tag: function(tag, ann) {
        // first, get the anchor location
        var range = this.cm_spans2range(
            tag.spans, ann
        );

        // set the anchor
        this.codemirror.doc.setCursor(
            range.anchor
        );
    },

    cm_spans2range: function(spans, ann) {
        // if the current mode is 
        if (this.vpp.$data.cm.display_mode == 'document') {
            return this.cm_doc_spans2range(spans, ann);

        } else if (this.vpp.$data.cm.display_mode == 'sentences') {
            return this.cm_sen_spans2range(spans, ann);

        } else {
            return this.cm_doc_spans2range(spans, ann);
        }
    },

    cm_range2spans: function(spans, ann) {
        // if the current mode is 
        if (this.vpp.$data.cm.display_mode == 'document') {
            return this.cm_doc_range2spans(spans, ann);

        } else if (this.vpp.$data.cm.display_mode == 'sentences') {
            return this.cm_sen_range2spans(spans, ann);

        } else {
            return this.cm_doc_range2spans(spans, ann);
        }
    },

    cm_sen_range2spans: function(sel_loc, ann) {
        var span0 = 0;

        // first, get the start span of this line
        var line_span0 = ann._sentences[
            sel_loc.anchor.line
        ].spans.start;
        var line_span1 = ann._sentences[
            sel_loc.head.line
        ].spans.start;

        // then move to the span of this line
        span0 = line_span0 + sel_loc.anchor.ch;
        span1 = line_span1 + sel_loc.head.ch;

        // the selection maybe from different direction
        if (span0 <= span1) {
            return span0 + '~' + span1;
        } else {
            return span1 + '~' + span0;
        }
    },

    cm_sen_spans2range: function(spans, ann) {
        var span_pos_0 = parseInt(spans.split('~')[0]);
        var span_pos_1 = parseInt(spans.split('~')[1]);

        // find the line number of span0
        var anchor = nlp_toolkit.find_linech(span_pos_0, ann._sentences);
        var head = nlp_toolkit.find_linech(span_pos_1, ann._sentences);

        return {
            anchor: anchor,
            head: head
        }
    },

    cm_doc_range2spans: function(sel_loc, ann) {
        var full_text = ann.text;
        // console.log('* calc doc range2spans: ');
        // console.log(sel_loc);
        var lines = full_text.split('\n');
        var span0 = 0;
        for (let i = 0; i < sel_loc.anchor.line; i++) {
            span0 += lines[i].length + 1;
        }
        span0 += sel_loc.anchor.ch;
        var span1 = 0;
        for (let i = 0; i < sel_loc.head.line; i++) {
            span1 += lines[i].length + 1;
        }
        span1 += sel_loc.head.ch;
        // console.log('* span0: ' + span0 + ', span1: ' + span1);

        if (span0 <= span1) {
            return span0 + '~' + span1;
        } else {
            return span1 + '~' + span0;
        }
    },

    cm_doc_spans2range: function(spans, ann) {
        var full_text = ann.text;

        // console.log('* calc doc spans2range: ');
        var span_pos_0 = parseInt(spans.split('~')[0]);
        var span_pos_1 = parseInt(spans.split('~')[1]);

        // calculate the line number
        var ln0 = full_text.substring(0, span_pos_0).split('\n').length - 1;
        var ln1 = full_text.substring(0, span_pos_1).split('\n').length - 1;

        // calculate the char location
        var ch0 = span_pos_0;
        
        // 2023-03-30: thanks to Riea's feedback!
        // when a file contains one and only one newline at the begining,
        // the ch0 cannot be calculated as the i==span_pos_0 is not reached
        // so need to set the loop end condition to i<=span_pos_0
        for (let i = 1; i <= span_pos_0; i++) {
            if (full_text[span_pos_0 - i] == '\n') {
                ch0 = i - 1;
                break;
            }
        }

        // TODO fix the potential cross lines bug
        var ch1 = ch0 + (span_pos_1 - span_pos_0);

        // return [ [ln0, ch0], [ln1, ch1] ];
        return {
            anchor: {line: ln0, ch: ch0},
            head:   {line: ln1, ch: ch1}
        }
    },

    cm_spans2coords: function(spans, ann) {
        var range = this.cm_spans2range(spans, ann);

        var coords_l = this.codemirror.charCoords(
            // { line: range[0][0], ch: range[0][1] },
            range.anchor,
            'local'
        );
        var coords_r = this.codemirror.charCoords(
            // { line: range[1][0], ch: range[1][1] },
            range.head,
            'local'
        );

        return { 
            l: coords_l, 
            r: coords_r 
        };
    },

    cm_draw_rtag: function(rtag, rtag_def, ann) {
        // for showing the rtag, we need:
        // 1. the atts for accessing the rtag
        // 2. the values of att_a and att_b, which are tag_id for etag
        // 3. get the tag, then call cm_draw_polyline

        // so, get all attrs
        var atts = this.vpp.get_idref_attrs(rtag_def);

        // next, get the values fron this rtag
        var etags = [];
        for (let i = 0; i < atts.length; i++) {
            var att = atts[i];
            var etag_id = rtag[att.name];

            if (typeof(etag_id) == 'undefined' || 
                etag_id == null || 
                etag_id == '') {
                // this att is just empty
                continue;
            }

            // check this etag
            var etag = this.vpp.get_tag_by_tag_id(etag_id, ann);
            if (etag == null) { 
                continue; 
            }
            if (etag.spans == dtd_parser.NON_CONSUMING_SPANS) {
                continue;
            }

            // ok, save this etag for later use
            etags.push(etag);
        }
        // then, check if there are more than two etags
        console.log('* found ' + etags.length + ' etags available for this link');

        // first, draw dots
        // for (let i = 0; i < etags.length; i++) {
        //     const etag = etags[i];
        //     this.cm_draw_rtag_on_etag(rtag, etag, ann);
        // }

        if (!this.vpp.$data.cm.enabled_link_complex) {
            return;
        }

        // second, draw polyline
        if (etags.length < 2) {
            // which means not enough etag for drawing line
            return;
        }
        var tag_a = etags[0];
        var tag_b = etags[1];

        console.log(
            '* try to draw line ['+rtag.id+'] between', 
            '['+tag_a.id+']-', 
            '['+tag_a.id+']'
        );

        // last, draw!
        this.cm_draw_polyline(
            rtag, tag_a, tag_b, ann
        );
    },

    cm_draw_etag_cap: function(etag, ann, cap) {
        // then get the coords
        var coords = this.cm_spans2coords(etag.spans, ann);
        // console.log('* found etag coords:', coords);

        // the basic x is just the tag left position
        var x = coords.l.left;
        // the basic y is a little higher
        var y = coords.l.top + 2.5;

        // find existing cap on this tag if there is
        // var tagcaps = $('#cm_svg_plots .tag-cap-' + etag.id);
        // for (let i = 0; i < tagcaps.length; i++) {
        //     const elem = tagcaps[i];
        //     var shape = this.get_elem_shape(elem);
        //     x += shape.width + 1;
        // }
        // find the relative x
        // var el = document.querySelector('#mark-etag-id-' + etag.id);
        // x = el.offsetLeft;

        // make a cap for this etag
        var svg_text = document.createElementNS(
            'http://www.w3.org/2000/svg', 'text'
        );
        svg_text.setAttribute('id', 'mark-tag-cap-id-' + etag.id);
        svg_text.setAttribute('text-anchor', 'left');
        svg_text.setAttribute('alignment-baseline', 'middle');
        svg_text.setAttribute('x', x);
        svg_text.setAttribute('y', y);
        svg_text.setAttribute('class', 
            "tag-cap border-tag-" + etag.tag + 
            " tag-cap-id-" + etag.id +
            " tag-cap-" + cap
        );
        // put the text in this cap
        var text_node_content = cap;
        svg_text.append(document.createTextNode(text_node_content));

        $('#cm_svg_plots').append(
            svg_text
        );
    },

    cm_draw_rtag_on_etag: function(rtag, tag, ann) {
        // then get the coords
        var coords = this.cm_spans2coords(tag.spans, ann);
        // console.log('* found etag coords:', coords);

        // the basic x is just the tag left position
        var x = coords.l.left;
        // move to middle
        x += (coords.l.right - coords.l.left) / 2 + 1;

        // the basic y is a little higher
        var y = coords.l.top + 2;

        // find existing linkdot on this tag if there is
        var linkdots = $('#cm_svg_plots .tag-linkdot-' + tag.id);

        // add offset to x
        for (let i = 0; i < linkdots.length; i++) {
            const elem = linkdots[i];
            var shape = this.get_elem_shape(elem);
            x += shape.width + 1;
        }

        // make a text
        var svg_text = document.createElementNS(
            'http://www.w3.org/2000/svg', 'text'
        );
        svg_text.setAttribute('id', 'mark-link-dot-id-' + rtag.id + '-' + tag.id);
        svg_text.setAttribute('text-anchor', 'left');
        svg_text.setAttribute('alignment-baseline', 'middle');
        svg_text.setAttribute('x', x);
        svg_text.setAttribute('y', y);
        svg_text.setAttribute('class', "tag-linkdot border-tag-" + tag.tag + " tag-linkdot-" + tag.id);

        // put the text
        var text_node_content = " ";
        if (this.vpp.$data.cm.enabled_link_name) {
            text_node_content = " " + rtag.id;
        }
        svg_text.append(document.createTextNode(text_node_content));

        $('#cm_svg_plots').append(
            svg_text
        );

        // this.make_svg_text_bg(svg_text, 'svgmark-tag-' + rtag.tag);
    },

    cm_draw_polyline: function(rtag, tag_a, tag_b, ann) {
        // then get the coords of both tags
        var coords_a = this.cm_spans2coords(tag_a.spans, ann);
        var coords_b = this.cm_spans2coords(tag_b.spans, ann);

        // the setting for the polyline
        var delta_height = 2;
        var delta_width = 0;

        // get the upper coords, which is the lower one
        var upper_top = coords_a.l.top < coords_b.l.top ? 
            coords_a.l.top : coords_b.l.top;
        upper_top = upper_top - delta_height;

        // get the sign for relative location
        var sign = coords_b.l.left - coords_a.l.left > 0 ? 1 : -1;

        // then calc the points for the polyline
        var xys = [
            // point, start
            [
                (coords_a.l.left + coords_a.r.left)/2,
                (coords_a.l.top + 4)
            ],
            // point joint 1
            [
                (coords_a.l.left + coords_a.r.left)/2 + sign * delta_width,
                upper_top
            ],
            // point, joint 2
            [
                ((coords_b.l.left + coords_b.r.left)/2 - sign * delta_width),
                upper_top
            ],
            // point, end
            [
                (coords_b.l.left + coords_b.r.left)/2,
                (coords_b.l.top + 3)
            ]
        ];

        // put all points togather
        var points = [];
        for (let i = 0; i < xys.length; i++) {
            const xy = xys[i];
            // convert to int for better display
            var x = Math.floor(xy[0]);
            var y = Math.floor(xy[1]);
            points.push(x + ',' + y);
        }

        // convert to a string
        points = points.join(' ');

        // create a poly line and add to svg
        // Thanks to the post!
        // https://stackoverflow.com/questions/15980648/jquery-added-svg-elements-do-not-show-up
        var svg_polyline = document.createElementNS(
            'http://www.w3.org/2000/svg', 'polyline'
        );
        svg_polyline.setAttribute('id', 'mark-link-line-id-' + rtag.id);
        svg_polyline.setAttribute('points', points);
        svg_polyline.setAttribute('class', "tag-polyline");
        // svg_polyline.setAttribute('marker-end', "url(#arrow)");

        $('#cm_svg_plots').append(
            svg_polyline
        );

        // NEXT, draw a text
        var svg_text = document.createElementNS(
            'http://www.w3.org/2000/svg', 'text'
        );
        svg_text.setAttribute('id', 'mark-link-text-id-' + rtag.id);
        svg_text.setAttribute('text-anchor', 'middle');
        svg_text.setAttribute('alignment-baseline', 'middle');
        svg_text.setAttribute('x', (xys[0][0] + xys[3][0]) / 2);
        svg_text.setAttribute('y', xys[1][1] + delta_height);
        svg_text.setAttribute('class', "tag-linktext");

        // put the text
        var text_node_content = rtag.id;
        // if (this.vpp.$data.cm.enabled_link_name) {
        //     text_node_content = rtag.tag + ': ' + rtag.id;
        // }
        svg_text.append(document.createTextNode(text_node_content));

        $('#cm_svg_plots').append(
            svg_text
        );

        // then create a background color
        this.make_svg_text_bg(svg_text, 'svgmark-tag-' + rtag.tag);
    },

    cm_calc_points: function(coords_a, coords_b) {

    },



    cm_highlight_editor_tag: function(tag_id) {
        // get this tag in editor
        var elm = $('#mark-etag-id-' + tag_id);
        if (elm.length != 1) {
            // which means no such element
            return; 
        }
        var flag_actived = elm.hasClass('mark-tag-active');

        // remove other class
        $('.mark-tag-active').removeClass('mark-tag-active');

        // add a class to this dom
        if (flag_actived) {

        } else {
            elm.addClass('mark-tag-active');
        }
    },

    // cm_draw_rtag_first_two: function(rtag, rtag_def, ann) {
    //     // for showing the polyline, we need:
    //     // 1. the att_a and att_b for accessing the rtag
    //     // 2. the values of att_a and att_b, which are tag_id for etag
    //     // 3. get the tag, then call cm_draw_polyline

    //     // so, get the att_a and att_b first
    //     var att_a = this.vpp.get_idref_attr_by_seq(rtag_def, 0);
    //     var att_b = this.vpp.get_idref_attr_by_seq(rtag_def, 1);

    //     // next, get the values
    //     var etag_a_id = rtag[att_a.name];
    //     var etag_b_id = rtag[att_b.name];
    //     // console.log(
    //     //     '* try to draw line ['+rtag.id+'] between', 
    //     //     att_a.name, '['+etag_a_id+']-', 
    //     //     att_b.name, '['+etag_b_id+']'
    //     // );

    //     // if the value is null or empty, just skip
    //     if (etag_a_id == null || etag_a_id == '') { return; }
    //     if (etag_b_id == null || etag_b_id == '') { return; }

    //     // convert the tag_id to tag
    //     var tag_a = this.vpp.get_tag_by_tag_id(etag_a_id, ann);
    //     var tag_b = this.vpp.get_tag_by_tag_id(etag_b_id, ann);

    //     // if the tag is not available, just skip
    //     if (tag_a == null || tag_b == null) { return; }

    //     // if one of the tags is non-consuming tag, just skip
    //     if (tag_a.spans == dtd_parser.NON_CONSUMING_SPANS ||
    //         tag_b.spans == dtd_parser.NON_CONSUMING_SPANS) {
    //         return;
    //     }

    //     // last, draw!
    //     this.cm_draw_polyline(
    //         rtag, tag_a, tag_b, ann
    //     );
    // },
});