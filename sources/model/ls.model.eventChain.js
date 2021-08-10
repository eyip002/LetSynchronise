'use strict';

class ModelEventChain {
    updateEventChains = null;      // Callback to function in ls.view.eventChain
    updateEventChainSelectors = null;
    
    database = null;
    modelDependency = null;
    
    constructor() { }
    
    
    // -----------------------------------------------------
    // Registration of callbacks from the controller
    
    registerUpdateEventChainsCallback(callback) {
        this.updateEventChains = callback;
    }
    
    registerUpdateEventChainSelectorsCallback(callback) {
        this.updateEventChainSelectors = callback;
    }
    
    
    // -----------------------------------------------------
    // Registration of model database
    
    registerModelDatabase(database) {
        this.database = database;
    }
    
    registerModelDependency(modelDependency) {
        this.modelDependency = modelDependency;
    }
    
    
    // -----------------------------------------------------
    // Class methods

    createEventChain(eventChain) {
        // Store event chain into Database
        return this.database.putObject(Model.EventChainStoreName, eventChain)
            .then(this.refreshViews());
    }
    
    getAllEventChains() {
        return this.database.getAllObjects(Model.EventChainStoreName)
            .then(allEventChains => allEventChains.map(eventChain => Chain.FromJson(eventChain)));
    }
    
    getEventChain(name) {
        return this.database.getObject(Model.EventChainStoreName, name)
            .then(eventChain => Chain.FromJson(eventChain));
    }

    deleteEventChain(name) {
        const promiseDeleteEventChain = this.database.deleteObject(Model.EventChainStoreName, name);
        
        const promiseDeleteEventChainInstances = this.getAllEventChainsInstances(name)
            .then(eventChainsInstances => Promise.all(
                eventChainsInstances.filter(eventChainInstance => (eventChainInstance.chainName == name))
                    .map(eventChainInstance => this.deleteEventChainInstance(eventChainInstance.name))
            ));

        return Promise.all([promiseDeleteEventChain, promiseDeleteEventChainInstances])
            .then(this.refreshViews());
    }
    
    deleteAllEventChains() {
        return this.database.deleteAllObjects(Model.EventChainStoreName)
            .then(this.database.deleteAllObjects(Model.EventChainInstanceStoreName))
            .then(this.refreshViews());
    }
    
    getAllEventChainsInstances() {
        return this.database.getAllObjects(Model.EventChainInstanceStoreName)
            .then(allEventChainInstances => allEventChainInstances.map(eventChainInstance => ChainInstance.FromJson(eventChainInstance)));
    }

    
    refreshViews() {
        return this.getAllEventChains()
            .then(result => this.updateEventChains(result))
            .then(result => this.modelDependency.getAllDependencies())
            .then(result => this.updateEventChainSelectors(result));
    }
    
    toString() {
        return "ModelEventChain";
    }
}
