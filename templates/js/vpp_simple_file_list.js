Vue.component('simple-file-list', {
    data: function () {
        return {
            update: 0,
            page_index: 0,
            page_size: 100,
            keyword: '',
            readonly: false,
        }
    },
    methods: {

        reject_tag: function(hashcode, tag_name, cm, tag_idx) {
            // call app_hotpot directly
            tag_idx = parseInt(tag_idx);
            app_hotpot.vpp.reject_iaa_tag(hashcode, tag_name, cm, tag_idx);
        },

        upper: function(v) {
            return v.toLocaleUpperCase();
        }
    },

    computed: {
        page_count: function() {
            return 1 + this.files
        },

        virtual_files: function() {
            if (this.files.length == 0) {
                return {
                    v_files: [],
                    v_files_paged: []
                };
            }

            // ok, let's do paging
            var v_files = this.files;
            var v_files_paged = v_files;

            if (Math.ceil(v_files.length / this.page_size) > 1) {
                v_files_paged = v_files.slice(
                    this.page_index * this.page_size,
                    (this.page_index + 1) * this.page_size
                );
            }

            return {
                v_files: v_files,
                v_files_paged: v_files_paged
            };
        }
    },

    props: [
        'files',
        'force_module_update',
    ],

    template: `
<div v-if="files != null"
    :force_module_update="force_module_update">
    <div class="simple-file-list-header">

    </div>

    <div class="simple-file-list-body">
        <ul class="w-100 file-list">
            <li v-for="vf in virtual_files.v_files_paged"
                class="file-list-item">
                {{ vf._filename }}
            </li>
        </ul>
    </div>

    <div class="simple-file-list-footer">
        {{ files.length }} files
        | 

    </div>
</div>
    `
});