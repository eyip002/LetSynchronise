'use strict';

class ControllerSchedule {
    _view = null;
    _model = null;
    _modelTask = null;
    
    constructor() { }

    set view(view) {
        this._view = view;
        
        // Register the handlers when setting the view.
        this._view.registerUpdateHandler(this.handleUpdateSchedule);
    }

    get view() {
        return this._view;
    }
    
    set model(model) {
        this._model = model;
    }
    
    get model() {
        return this._model;
    }
    
    set modelTask(modelTask) {
        this._modelTask = modelTask;
        
        // Register the handlers when setting the model.
        this._modelTask.registerUpdateScheduleCallback([this.callbackUpdateSchedule]);

        // Hack to populate the View with dependencies once the database is ready
        window.addEventListener('DatabaseReady', (event) => {
            this._modelTask.getAllTasks([this.callbackUpdateSchedule]);
        });
    }
    
    get modelTask() {
        return this._modelTask;
    }
    
    
    // -----------------------------------------------------
    // Handlers for events from the view to the model
    
    // Handler for updaing the task schedule.
    // Arrow function is used so that 'this' is accessible when the handler is called within the view.
    handleUpdateSchedule = (callback) => {
        this.modelTask.getAllTasks([callback]);
    }
    
    
    // -----------------------------------------------------
    // Callbacks for events from the model to the view
    
    // Callback for updating the task schedule.
    callbackUpdateSchedule = (taskParametersSet) => {
        this.view.updateSchedule(taskParametersSet);
    }

    toString() {
    	return `ControllerSchedule with ${this.view} and ${this.model}`;
    }
}
