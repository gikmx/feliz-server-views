'use strict';

const PATH = require('path');
const Vision = require('vision');

const Conf = require('./support/conf');
const Name = 'plugins:views';

module.exports = function views(){
    if (this.plugins.indexOf('server') !== -1)
        throw this.error(`${Name} should be loaded after plugins:server`)
    // Wait for the initial server plugins load, then load Vision, then inject engine.
    const vision$ = this.observable
        .fromEvent(this.events.internal(), 'plugins:server:plugins')
        .switchMap(({server}) => this.observable
            .bindNodeCallback(server.register.bind(server))(Vision)
            .mapTo(server))
        .map(onReady.bind(this))
        .subscribe();
    // no need to wait, carry on.
    return this.observable.of(this)
}

function onReady(server){
    // inject conf and cache the value to reduce conf.getter call
    if (!this.conf.views) this.conf = Conf;
    else this.conf = this.utils.object(Conf).merge({ views: this.conf.views });
    const conf = this.conf.views;
    // validate engine options
    if (!this.util.is(conf).object()) throw this.error.type({
        name: `${Name}:conf.engine`,
        type: 'Object',
        data: conf
    });
    // get the hapi-specific configuation for the engine
    let engine;
    if (conf.engine.name === 'raw') engine = conf.engine.conf;
    else try {
        engine = require(`./engines/${conf.engine.name}`).call(this, conf.engine.conf);
    } catch (e) {
        e.message = `Could not load ${conf.engine.name} engine: ${e.message}`;
        throw e;
    }
    // Absolute urls must always be allowed, the engines need it.
    engine.allowAbsolutePaths = true;
    // Register the corresponding view engine
    server.views(engine);
    // replace default view handler with an "improved" one.
    server.ext('onRequest', onRequest.bind(this));
}


function onRequest(request, reply){
    // Determine if this is a request we should extend (defined on router)
    const route = this.router.routes.filter(route => route.path == request.path).shift();
    if (!route) return reply.continue();
    route.root = PATH.dirname(route.path);
    const index = this.conf.views.index;
    const ext   = this.path.views.ext;
    // Keep a copy of the original view renderer (vision)
    const renderer = reply.view;
    // Create a new renderer by hacking into Hapi.
    // TODO: Normally this should be done via «this.server.decorate»
    //       but I haven't found a way of doing it this way. Improve this.
    this.server._replier._decorations.view = function(){
        const args = Array.prototype.slice.call(arguments);
        // if no arguments sent, let the original renderer deal with it.
        if (!args.length) return renderer.apply(this, args);
        // if more than one arguments are sent, use the normal renderer.
        // but if a relative path is sent, resolve it.
        if (args.length > 1){
            let path = args.shift();
            if (path[0] == '.') path = PATH.resolve(route.root, path);
            args.unshift(path);
            return renderer.apply(this, args);
        }
        // if only one argument is sent, try to load the default view
        args.unshift(PATH.join(route.root, `${index}${ext}`))
        return renderer.apply(this, args);
    }
    reply.continue();
}
