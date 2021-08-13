Vue.component('iaa-tag-info-gs', {
    data: function () {
        return {
            update: 0,
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
        
    },

    props: [
        'cm',
        'from',
        'hashcode',
        'tag_obj',
        'tag_idx',
        'ann',
        'dtd',
        'force_module_update',
    ],

    template: `
<div v-if="tag_obj != null"
    class="iaa-tag-detail-info w-100 d-flex flex-column" 
    v-bind:class="'iaa-tag-detail-info-gs'"
    :force_module_update="force_module_update">
    <div class="d-flex flex-row flex-wrap flex-align-end">
    
        <div class="iaa-tag-detail-oper">
            <button class="btn btn-xs"
                :title="'Reject this [' + tag_obj.tag.text + '] from goldstandard'"
                v-on:click="reject_tag(hashcode, tag_obj.tag.tag, cm, tag_idx)">
                Reject
            </button>
        </div>

        <div class="iaa-tag-detail-info-text-gs mr-2">
            <span class="mr-1">
                <i class="fa fa-user"></i>
                <b>
                {{ upper(tag_obj.from) }}
                </b>
            </span>
            <span>
                {{ tag_obj.tag.spans }}: 
                <b>
                    {{ tag_obj.tag.text }}
                </b>
            </span>
        </div>
        
    </div>
</div>
<div v-else
    class="iaa-tag-detail-info w-100 d-flex flex-column">
    Rejected or Not Decided
</div>
`
});