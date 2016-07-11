'use strict';

const Vision = require('vision');
const Pug    = require('pug');

module.exports = {
    name: 'views',
    data: Vision,
    when: { 'plugin:views': function(){
        let options = this.options.views;
        if (!this.util.is(options).object()) options = {};
        if (!this.util.is(options.path).array()) options.path = [this.path.app.bundles];
        if (!this.util.is(options.engine).object()) options.engine = { pretty:true };
        this.server.views({
            engines        : { jade: Pug },
            path           : options.path,
            compileOptions : options.engine
        });
    }}
}
