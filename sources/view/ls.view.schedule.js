'use strict';

class ViewSchedule {
    root = null;
    modelDependency = null;

    prologueField = null;
    hyperPeriodField = null;
    makespanField = null;

    updateButton = null;

    schedule = null;
    scheduleTooltip = null;
    dataflowTooltip = null;

    constructor() {
        this.root = document.querySelector('#nav-analyse');
        
        // Update the static schedule
        this.prologueField = this.root.querySelector('#prologue');
        this.hyperPeriodField = this.root.querySelector('#hyperperiod');
        this.makespanField = this.root.querySelector('#makespan');

        this.updateButton = this.root.querySelector('#update');

        this.schedule = d3.select('#view-schedule');
        this.scheduleTooltip = this.root.querySelector('#view-schedule-tooltip');
        this.dataflowTooltip = this.root.querySelector('#view-dataflow-tooltip');

        // Set the default makespan
        this.makespan = 10;
    }
    
    get prologue() {
        return this.prologueField.value;
    }
    
    set prologue(prologue) {
        this.prologueField.value = prologue;
    }
    
    get hyperPeriod() {
        return this.hyperPeriodField.value;
    }
    
    set hyperPeriod(hyperPeriod) {
        this.hyperPeriodField.value = hyperPeriod;
    }

    get makespan() {
        return this.makespanField.value;
    }
    
    set makespan(makespan) {
        this.makespanField.value = makespan;
    }
    
    
    // -----------------------------------------------------
    // Registration of handlers from the controller

    registerUpdateHandler(getScheduleHandler) {
        this.updateButton.addEventListener('click', event => {
            // Prevent the default behaviour of submitting the form and the reloading of the webpage.
            event.preventDefault();
            
            // Ask the model to give us the current task set via a callback.
            getScheduleHandler(this.updateSchedule.bind(this), this.makespan);
        });
    }
    
    
    // -----------------------------------------------------
    // Registration of model dependency
    
    registerModelDependency(modelDependency) {
        this.modelDependency = modelDependency;
    }
    
    
    async updateSchedule(promise) {
        const taskParametersSet = await promise['promiseAllTasks'];
        const tasksInstances = await promise['promiseAllTasksInstances'];
        const dataflowsSet = await promise['promiseAllDependenciesInstances'];
    
        this.updatePrologue(taskParametersSet);
        this.updateHyperPeriod(taskParametersSet);
        
        // Draw new schedule.
        const {svgElement, scale, taskIndices} = this.drawSchedule(tasksInstances);
        
        // Draw communication dependencies.
        this.drawDataflows(svgElement, scale, taskIndices, dataflowsSet);
    }
    
    updatePrologue(taskParametersSet) {
        const initialOffsets = taskParametersSet.map(taskParameters => taskParameters.initialOffset).flat();
        this.prologue = Utility.MaxOfArray(initialOffsets);
    }
    
    updateHyperPeriod(taskParametersSet) {
        const periods = taskParametersSet.map(taskParameters => taskParameters.period).flat();
        this.hyperPeriod = Utility.LeastCommonMultipleOfArray(periods);
    }
    
    drawSchedule(tasksInstances) {
        // Create function to scale the data along the x-axis of fixed-length
        const scale =
        d3.scaleLinear()
          .domain([0, this.makespan])
          .range([0, View.Width - 2 * View.SvgPadding]);

        // Delete the existing task previews, if they exist
        // and set up the canvas.
        this.schedule.selectAll('*').remove();
        const svgElement = this.schedule.append('svg');
        
        // Draw the task instances.
        var taskIndices = {};
        for (const [index, taskInstances] of tasksInstances.entries()) {
            this.drawTaskInstances(taskInstances, svgElement, scale, index);
            taskIndices[taskInstances.name] = index;
        }
        
        svgElement
          .attr('width', `${View.Width}px`)
          .attr('height', `${Object.keys(tasksInstances).length * View.TaskHeight}px`);
        
        return {svgElement: svgElement, scale: scale, taskIndices: taskIndices};
    }
    
    drawTaskInstances(taskInstances, svgElement, scale, index) {
        const tooltip = this.scheduleTooltip;   // Need to create local reference so that it can be accessed inside the mouse event handlers.

        const group =
        svgElement.append('g')
                    .attr('transform', `translate(${View.SvgPadding}, ${View.SvgPadding})`);
        
        // -----------------------------
        // Group for textual information
        const textInfo =
        group.append('g')
               .attr('transform', `translate(0, ${index * View.TaskHeight + View.SvgPadding})`);

        // Add the task's name, inputs, and outputs
        textInfo.append('text')
                  .text(`Task: ${taskInstances.name}`);

        // -----------------------------
        // Group for graphical information
        const graphInfo =
        group.append('g')
               .attr('transform', `translate(0, ${index * View.TaskHeight + 2.5 * View.SvgPadding})`);
        
        const instances = taskInstances.value;
        const firstPeriodStartTime = instances[0].periodStartTime;
        const lastPeriodDuration = instances[instances.length -1].periodEndTime - instances[instances.length -1].periodStartTime;

        // Add horizontal line for the task's initial offset
        graphInfo.append('line')
                   .attr('x1', 0)
                   .attr('x2', scale(firstPeriodStartTime))
                   .attr('y1', `${View.BarHeight + View.BarMargin}`)
                   .attr('y2', `${View.BarHeight + View.BarMargin}`)
                   .attr('class', 'initialOffset');
        
        // Add vertical line at the start of the initial offset
        graphInfo.append('line')
                   .attr('x1', 0)
                   .attr('x2', 0)
                   .attr('y1', `${View.BarHeight + View.TickHeight + View.BarMargin}`)
                   .attr('y2', `${View.BarHeight - View.TickHeight}`)
                   .attr('class', 'boundary');
        
        // Add horizontal line for the task's periods
        graphInfo.append('line')
                   .attr('x1', scale(firstPeriodStartTime))
                   .attr('x2', scale(this.makespan + lastPeriodDuration))
                   .attr('y1', `${View.BarHeight + View.BarMargin}`)
                   .attr('y2', `${View.BarHeight + View.BarMargin}`)
                   .attr('class', 'period');

        for (const [index, instance] of instances.entries()) {
            // Add the task's LET duration
            graphInfo.append('rect')
                       .attr('x', scale(instance.letStartTime))
                       .attr('width', scale(instance.letEndTime - instance.letStartTime))
                       .attr('height', View.BarHeight)
                      .on('mouseover', function() {
                          d3.select(this)
                            .transition()
                            .ease(d3.easeLinear)
                            .style('fill', 'var(--blue)');
                          tooltip.innerHTML = `${taskInstances.name} instance ${index}`;
                          tooltip.style.visibility = 'visible';
                      })
                      .on('mousemove', function() {
                          tooltip.style.top = `${d3.event.pageY - 2 * View.BarHeight}px`;
                          tooltip.style.left = `${d3.event.pageX}px`;
                      })
                      .on('mouseout', function() {
                          d3.select(this)
                            .transition()
                            .ease(d3.easeLinear)
                            .style('fill', 'var(--gray)');
                          tooltip.style.visibility = 'hidden';
                      });
            
            // Add vertical line at the start of the period
            graphInfo.append('line')
                     .attr('x1', scale(instance.periodStartTime))
                     .attr('x2', scale(instance.periodStartTime))
                     .attr('y1', `${View.BarHeight + View.TickHeight + View.BarMargin}`)
                     .attr('y2', `${View.BarHeight - View.TickHeight}`)
                     .attr('class', 'boundary');
        }
        
        // Create x-axis with correct scale.
        const xAxis = d3.axisBottom().scale(scale);
        
        graphInfo.append('g')
                 .attr('transform', `translate(0, ${View.BarHeight + 2 * View.TickHeight})`)
                 .call(xAxis)
                 .call(g => g.select('.domain').remove());
    }
    
    drawDataflows(svgElement, scale, taskIndices, dataflowsSet) {
        // Define arrow head of a dataflow line
        const svgDefs =
        svgElement.append('defs')
                  .append('marker')
                    .attr('id', 'arrow')
                    .attr('viewBox', '0 -5 10 10')
                    .attr('refX', 5)
                    .attr('refY', 0)
                    .attr('markerWidth', 4)
                    .attr('markerHeight', 4)
                    .attr('orient', 'auto')
                  .append('path')
                    .attr('d', 'M0, -5L10, 0L0, 5')
                    .attr('class', 'arrowHead');
        for (const dataflows of dataflowsSet) {
        	for (const dataflow of dataflows.value) {
	            this.drawDataflow(svgElement, scale, taskIndices, dataflows.name, dataflow);
        	}
        }
    }
        
    drawDataflow(svgElement, scale, taskIndices, dependencyName, dataflow) {
        const yOffset = 0.5 * View.BarHeight + 2.5 * View.SvgPadding;
        const xOffset = 20;
        const tooltip = this.dataflowTooltip;   // Need to create local reference so that it can be accessed inside the mouse event handlers.
        
        const sendEvent = dataflow.sendEvent;
        const receiveEvent = dataflow.receiveEvent;
        sendEvent.timestamp = scale(sendEvent.timestamp);
        receiveEvent.timestamp = scale(receiveEvent.timestamp);

        const points = [
            { x: sendEvent.timestamp,                y: taskIndices[sendEvent.task] },
            { x: sendEvent.timestamp + xOffset,      y: taskIndices[sendEvent.task] },
            { x: receiveEvent.timestamp - xOffset,   y: taskIndices[receiveEvent.task] },
            { x: receiveEvent.timestamp,             y: taskIndices[receiveEvent.task] }
        ]

        var line = d3.line()
                     .x((point) => point.x)
                     .y((point) => yOffset + View.TaskHeight * point.y)
                     .curve(d3.curveBundle);
        
        const group =
        svgElement.append('g')
                    .attr('class', `dependency view-dependency-${dependencyName}`)
                    .attr('transform', `translate(${View.SvgPadding}, ${View.SvgPadding})`);
        
        group.append('path')
               .attr('d', line(points))
               .attr('marker-end', 'url(#arrow)')
             .on('mouseover', function() {
               d3.select(this)
                 .transition()
                 .ease(d3.easeLinear)
                 .style('stroke', 'var(--orange)');
               tooltip.innerHTML = `${dependencyName}:<br/>${Utility.TaskPorts(sendEvent.task, [sendEvent.port])} &rarr; ${Utility.TaskPorts(receiveEvent.task, [receiveEvent.port])}`;
               tooltip.style.visibility = 'visible';
             })
             .on('mousemove', function() {
               tooltip.style.top = `${d3.event.pageY - View.SvgPadding}px`;
               tooltip.style.left = `${d3.event.pageX + 2 * View.SvgPadding}px`;
             })
             .on('mouseout', function() {
               d3.select(this)
                 .transition()
                 .ease(d3.easeLinear)
                 .style('stroke', 'var(--red)');
               tooltip.style.visibility = 'hidden';
             });
    }
    
    toString() {
        return 'ViewSchedule';
    }
}
