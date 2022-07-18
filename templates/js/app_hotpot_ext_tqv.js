/**
 * This is an extension for text quick viewer 
 */

Object.assign(app_hotpot.vpp_data, {
    // for text quick viewer (tqv)
    show_text_quick_viewer: false,
    tqv_header: '',
    tqv_content: '',
    tqv_footer: '',
    tqv_pos_x: -999,
    tqv_pos_y: -999,
});


Object.assign(app_hotpot, {
    bind_tqv_dragable: function() {
        $( ".tq-viewer-box" ).draggable({ handle: ".tq-viewer-header" });
    },
});


Object.assign(app_hotpot.vpp_methods, {
    hide_tqv: function() {
        this.show_text_quick_viewer = false;
    },

    on_drag_tqv: function(event) {
        var x = event.clientX;
        var y = event.clientY;
        console.log('* show tqv at (' + x + ', ' + y + ')');
    },

    show_tqv_at: function(text, x, y, header, footer) {
        if (typeof(x) == 'undefined') {
            x = ($(window).width() - 500) / 2;
        }
        if (typeof(y) == 'undefined') {
            y = ($(window).height() - 250) / 2;
        }
        if (typeof(header) == 'undefined') {
            header = 'Text';
        }
        if (typeof(footer) == 'undefined') {
            footer = '';
        }

        // update display content
        this.tqv_header = header;
        this.tqv_content = text;
        this.tqv_footer = footer;

        // update the position
        this.tqv_pos_x = x + 10;

        if ((y+220) < $(window).height()) {
            this.tqv_pos_y = y;
        } else {
            this.tqv_pos_y = $(window).height() - 220;
        }

        this.show_text_quick_viewer = true;
    }
});