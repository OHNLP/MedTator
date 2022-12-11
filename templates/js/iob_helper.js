/**
 * IOB2/BIO format helper
 * 
 * This is a helper for parse, analyze, and save IOB2/BIO format files.
 */
var iob2_helper = {
    /**
     * Parse a IOB2/BIO format file
     * 
     * @param {string} fn the file name of a IOB2/BIO file
     * @param {string} text the full text of a IOB2/BIO file
     * @returns parsed object
     */
    parse: function(fn, text) {
        let ret = {
            fn: fn,
            sentences: []
        };

        return ret;
    },

    /**
     * Get statistics of a parsed IOB object
     * 
     * @param {object} iob a parsed IOB2/BIO object
     * @returns statistic results
     */
    get_stat: function(iob) {
        let stat = {};
        return stat;
    },

    /**
     * Convert a parsed IOB2/BIO object to string for saving
     * 
     * @param {object} iob a parsed IOB2/BIO object
     * @returns stringified result
     */
    to_text: function(iob) {
        let txt = '';

        return txt;
    }
};