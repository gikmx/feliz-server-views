'use strict';

module.exports = {
    name: 'views',
    data: { register: function(request, options, next){ next() } }
    when: {
        'plugin:views': function(){

        }
    }
}
