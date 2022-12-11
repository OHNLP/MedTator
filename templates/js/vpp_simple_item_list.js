Vue.component('simple-item-list', {
    data: function () {
        return {
            page_num: 1,
            keyword: '',

            // which file is clicked
            current_item: null,
        }
    },
    methods: {
        upper: function(v) {
            return v.toLocaleUpperCase();
        },

        clear_keyword: function() {
            this.keyword = '';
        },

        on_click_item: function(vi) {
            // send the back the item itself
            this.callback_on_click_item(vi.item);

            if (this.readonly) {

            } else {
                this.current_item = vi;
            }
        },

        on_click_save_item: function(vi) {
            // vi.file.has_saved = true;
            console.log('* saved item', vi);
            // just for update
            this.force_module_update = Math.random();
        }
    },

    computed: {
        page_count: function() {
            this.force_module_update;
            return Math.ceil(this.v_filtered_items.length / this.page_size);
        },

        v_filtered_items: function() {
            // just for update
            this.force_module_update;

            var v_filtered_items = [];

            for (let i = 0; i < this.items.length; i++) {
                var css_class = '';
                if (this.current_item != null &&
                    this.items[i][this.name_attr] == this.current_item.item[this.name_attr]) {
                    css_class = 'file-selected';
                }
                if (this.keyword == '' || this.items[i][this.name_attr].indexOf(this.keyword) >= 0) {
                    // for perf issue, use this instead of push
                    // this is the virtual item that contains more info
                    v_filtered_items[v_filtered_items.length] = {
                        // the original item index
                        idx: i,

                        // the link to the original item object
                        item: this.items[i],

                        // a status for show different style
                        css_class: css_class,
                    };
                }
            }

            return v_filtered_items;
        },

        v_paged_items: function() {
            // just for update
            this.force_module_update;

            if (this.items.length == 0) {
                return [];
            }

            // ok, let's do paging
            var pitems = this.v_filtered_items;

            if (this.page_count > 1) {
                pitems = this.v_filtered_items.slice(
                    (this.page_num - 1) * this.page_size,
                    this.page_num * this.page_size
                );
            }

            return pitems;
        },
    },

    props: {
        items: {
            default: [],
        },
        name_attr: {
            default: 'fn'
        },
        readonly: {
            default: false,
        },
        page_size: {
            default: 50
        },
        force_module_update: {},
        callback_on_click_item: {}
    },

    template: `
<div :force_module_update="force_module_update"
    class="simple-item-list">

    <div class="simple-item-list-header">
        <span class="mr-1"
            title="Filter by keyword">
            Filter: 
        </span>
        <input type="text" 
            class="ipt-xs"
            style="width: 55px;"
            v-model="keyword">

        <button class="btn btn-xs"
            v-on:click="clear_keyword()">
            <i class="fa fa-times"></i>
        </button>
    </div>

    <div class="simple-item-list-body"
        style="">
        <ul class="w-100 item-list">
            <li v-for="vi in v_paged_items"
                v-bind:class="vi.css_class"
                v-on:click="on_click_item(vi)"
                class="item-list-row">
                <div class="d-flex flex-row flex-justify-between">
                    <div class="item-list-row-name"
                        v-bind:class="{'item-list-row-name-unsaved': !vi.item.has_saved}">

                        <span v-if="!vi.item.has_saved" 
                            v-on:click="on_click_save_item(vi)"
                            title="Save the changes"
                            class="icon-fg-unsaved mr-1">
                            <i class="fa fa-save"></i>
                        </span>

                        <span>
                        {{ vi.item[name_attr] }}
                        </span>
                    </div>
                </div>
            </li>
        </ul>
    </div>

    <div class="simple-item-list-footer" 
        style="text-align: center;">

        {{ v_filtered_items.length }}

        <button class="btn btn-xs"
            v-on:click="page_num = 1">
            <i class="fas fa-step-backward"></i>
        </button>

        <button class="btn btn-xs"
            v-bind:disabled="page_num == 1"
            v-on:click="page_num -= 1">
            <i class="fas fa-caret-left"></i>
        </button>

        <select v-model="page_num"
            class="select-xs"
            style="width: 40px;">
            <option v-for="pn in page_count"
                v-bind:value="pn">
                {{ pn }}
            </option>
        </select>
        / {{ page_count }}

        <button class="btn btn-xs"
            v-bind:disabled="page_num == page_count"
            v-on:click="page_num += 1">
            <i class="fas fa-caret-right"></i>
        </button>
        
        <button class="btn btn-xs"
            v-on:click="page_num = page_count">
            <i class="fas fa-step-forward"></i>
        </button>

    </div>
</div>
    `
});