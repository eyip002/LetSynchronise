'use strict';

class ControllerTask {
    _view = null;
    _viewSchedule = null;
    _model = null;
    _modelDependency = null;
    _modelEventChain = null;
    
    constructor() { }
    
    set view(view) {
        this._view = view;

        // Register the handlers when setting the view.
        this._view.registerSubmitHandler(this.handleCreateTask);
        this._view.registerDeleteHandler(this.handleDeleteTask);
    }
    
    get view() {
        return this._view;
    }
    
    set viewSchedule(viewSchedule) {
        this._viewSchedule = viewSchedule;
    }
    
    get viewSchedule() {
        return this._viewSchedule;
    }
    
    set model(model) {
        this._model = model;
        
        // Register the handlers when setting the model.
        this._model.registerUpdateTasksCallback(this.callbackUpdateTasks);
        this._model.registerNotifyChangesCallback(this.callbackNotifyChanges);
        
        // Hack to populate the View with tasks once the database is ready
        window.addEventListener('DatabaseReady', (event) => {
            this._model.getAllTasks()
                .then(result => this.callbackUpdateTasks(result));
        });
    }
    
    get model() {
        return this._model;
    }
    
    set modelDependency(modelDependency) {
        this._modelDependency = modelDependency;
        
        // Register the model dependency with the model.
        this._model.registerModelDependency(this._modelDependency);
    }
    
    get modelDependency() {
        return this._modelDependency;
    }
    
    set modelEventChain(modelEventChain) {
        this._modelEventChain = modelEventChain;
        
        // Register the model event chain with the model.
        this._model.registerModelEventChain(this._modelEventChain);
    }
    
    get modelEventChain() {
        return this._modelEventChain;
    }
    

    // -----------------------------------------------------
    // Handlers for events from the view to the model
    
    // Handler for creating a task.
    // Arrow function is used so that 'this' is accessible when the handler is called within the view.
    handleCreateTask = (taskParameters) => {
        this.model.createTask(taskParameters);
    }
    
    // Handler for deleting a task.
    handleDeleteTask = (name) => {
        this.model.deleteTask(name);
    }
        
    
    // -----------------------------------------------------
    // Callbacks for events from the model to the view
    
    // Callback for updating the displayed tasks.
    callbackUpdateTasks = (tasks) => {
        this.view.updateTasks(tasks);
    }

    // Callback for notifying the schedule view that tasks have changed.
    callbackNotifyChanges = () => {
        this.viewSchedule.notifyChanges();
    }
    
    
    toString() {
        return `ControllerTask with ${this.view} and ${this.model}`;
    }
}
