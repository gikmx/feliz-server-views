'use strict';

const Vision = require('vision');

module.exports = {
    name: 'views',
    data: Vision,
    when: { 'plugin:views': function(){

        const DEFAULT = 'pug';
        let options   = this.options.views;

        if (!this.util.is(options).object()) options = {};
        if (!this.util.is(options.type).string()) options.type = DEFAULT;
        if (!this.util.is(options.path).array()) options.path = [this.path.bundles];
        if (!this.util.is(options.engine).object()) options.engine = {};

        const types = ['pug', 'ejs', 'nunjucks'].reduce(function(acc,cur){
            acc[cur] = require(`./${cur}`);
            return acc;
        }, {});

        types.raw = () => options.engine;

        if (!types[options.type]) throw this.error.type({
            name: 'feliz.views.type',
            type: Object.keys(types).join(' || '),
            data: options.type
        });

        this.server.views(types[options.type].call(this, options));
    }}
}
