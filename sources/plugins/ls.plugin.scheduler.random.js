'use strict';

class PluginSchedulerRandom {
    // Plug-in Metadata
    static get Name()     { return 'Random Task Scheduling'; }
    static get Author()   { return 'Eugene Yip'; }
    static get Type()     { return Plugin.Type.Scheduler; }
    static get Category() { return Plugin.Category.NonPreemptive; }

    
    // Random non-preemptive scheduling of task execution.
    static async Result(makespan, executionTiming) {
        // Create instances of tasks, execution times, data dependencies, and event chains.
        await Plugin.DeleteSchedule();
        await Plugin.CreateAllTaskInstances(makespan, executionTiming);
        await Plugin.CreateAllDependencyAndEventChainInstances(makespan);
        
        const scheduleElementSelected = ['schedule'];
        const schedule = await Plugin.DatabaseContentsGet(scheduleElementSelected);
        const tasks = await schedule[Model.TaskInstancesStoreName];

        const result = this.Algorithm(tasks);
        if (!result.schedulable) {
            alert(result.message);
            return;
        }
        
        return Plugin.DatabaseContentsDelete(scheduleElementSelected)
            .then(Plugin.DatabaseContentsSet(schedule, scheduleElementSelected));
    }
    
    // Non-preemptive random.
    static Algorithm(tasks) {
        // Do nothing if the task set is empty.
        if (tasks.length == 0) {
            return { 'schedulable': true, 'message': 'No tasks to schedule' };
        }
    
        // Track how far we are into the schedule.
        let currentTime = 0;
        
        // For each task, keep track of the instance we are trying to schedule.
        // A null index means that all instances of a task have been scheduled.
        let taskInstanceIndices = new Array(tasks.length);
        taskInstanceIndices.fill(0);
        
        // Schedule all the task instances in chronological order, based on their LET start time.
        // Task instances with the same LET start time are selected arbitrarily.
        while (true) {
            let chosenTask = { 'number': null, 'instance': null };
            for (const [taskNumber, task] of tasks.entries()) {
                if (taskInstanceIndices[taskNumber] == null) {
                    continue;
                }
                
                // Choose the task instance with the minimum LET start time.
                const taskInstance = task.value[taskInstanceIndices[taskNumber]];
                if (chosenTask.instance == null || taskInstance.letStartTime < chosenTask.instance.letStartTime) {
                    chosenTask.number = taskNumber;
                    chosenTask.instance = taskInstance;
                }
            }
            
            // Make sure the current time is not earlier than the chosen task instance's LET start time.
            currentTime = Math.max(currentTime, chosenTask.instance.letStartTime);
            
            // Make sure the chosen task instance finishes its execution in its LET.
            const nextTime = currentTime + chosenTask.instance.executionTime;
            if (nextTime > chosenTask.instance.letEndTime) {
                const message = `Could not schedule enough time for task ${tasks[chosenTask.number].name}, instance ${chosenTask.instance.instance}!`;
                return { 'schedulable': false, 'message': message };
            }
            
            // Create the execution interval for the chosen task instance.
            const executionInterval = new Utility.Interval(currentTime, nextTime);
            chosenTask.instance.executionIntervals.push(executionInterval);
            
            // Advance the current time to the next time.
            currentTime = nextTime;
            
            // Consider the next instance of the chosen task in the next round of scheduling decisions.
            taskInstanceIndices[chosenTask.number]++;
            if (taskInstanceIndices[chosenTask.number] == tasks[chosenTask.number].value.length) {
                taskInstanceIndices[chosenTask.number] = null;
            }
            
            // Terminate when all task instances have been scheduled.
            if (!taskInstanceIndices.some(element => element != null)) {
                break;
            }
        }

        return { 'schedulable': true, 'message': 'Scheduling finished' };
    }
    
}
