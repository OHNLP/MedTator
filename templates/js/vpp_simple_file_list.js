Vue.component('simple-file-list', {
    data: function () {
        return {
            update: 0,
            page_num: 1,
            page_size: 50,
            keyword: '',

            // which file is clicked
            current_fn: null,
        }
    },
    methods: {
        upper: function(v) {
            return v.toLocaleUpperCase();
        },

        clear_keyword: function() {
            this.keyword = '';
        },

        on_click_file: function(f) {
            this.callback_on_click_file(f.fn);

            if (this.readonly) {

            } else {
                this.current_fn = f.fn;
            }
        }
    },

    computed: {
        page_count: function() {
            this.force_module_update;
            return Math.ceil(this.v_filtered_files.length / this.page_size);
        },

        v_filtered_files: function() {
            // just for update
            this.force_module_update;

            var v_filtered_files = [];

            for (let i = 0; i < this.files.length; i++) {
                var css_class = '';
                if (this.files[i].fn == this.current_fn) {
                    css_class = 'file-selected';
                }
                if (this.keyword == '' || this.files[i].fn.indexOf(this.keyword) >= 0) {
                    // for perf issue, use this instead of push
                    v_filtered_files[v_filtered_files.length] = {
                        fn: this.files[i].fn,
                        css_class: css_class
                    };
                }
            }

            return v_filtered_files;
        },

        v_paged_files: function() {
            // just for update
            this.force_module_update;

            if (this.files.length == 0) {
                return [];
            }

            // ok, let's do paging
            var pfiles = this.v_filtered_files;

            if (this.page_count > 1) {
                pfiles = this.v_filtered_files.slice(
                    (this.page_num - 1) * this.page_size,
                    this.page_num * this.page_size
                );
            }

            return pfiles;
        },
    },

    // props: [
    //     'files',
    //     'readonly',
    //     'force_module_update',
    //     'callback_on_click_file'
    // ],
    props: {
        files: {
            default: [],
        },
        readonly: {
            default: false,
        },
        force_module_update: {},
        callback_on_click_file: {}
    },

    template: `
<div :force_module_update="force_module_update"
    class="simple-file-list">

    <div class="simple-file-list-header">
        <span class="mr-1"
            title="Filter the files by file name">
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

    <div class="simple-file-list-body"
        style="">
        <ul class="w-100 file-list">
            <li v-for="f in v_paged_files"
                v-bind:class="f.css_class"
                v-on:click="on_click_file(f)"
                class="file-list-item">
                {{ f.fn }}
            </li>
        </ul>
    </div>

    <div class="simple-file-list-footer" 
        style="text-align: center;">

        {{ v_filtered_files.length }} files

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