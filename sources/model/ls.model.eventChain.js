class EventChain {
    segment = null;    // Dependency
    successor = null;

    constructor(dependency) {
        this.segment = dependency;
    }
    
    static FromJson(json) {
    	let eventChain = new EventChain(json.segment);
    	if (json.successor) {
	    	eventChain.successor = EventChain.FromJson(json.successor);
    	}
    	
    	return eventChain;
    }
    
    get segment() {
        return this.segment;
    }
    
    get successor() {
        return this.successor;
    }
    
    set successor(eventChain) {
        if (this.successor) {
            alert('EventChain: Overwriting a successor!');
        }
        
        this.successor = eventChain;
    }
    
    get sourceTask() {
        return this.segment.source.task;
    }
    
    // Generator function to visit each segment in the event chain
	* generator() {
		yield this.segment;
		
		if (this.successor) {
			yield* this.successor.generator();
		}		
	}

    includes(dependency) {
        if (this.segment == dependency) {
            return true;
        } else if (this.successor == null) {
            return false;
        }
        
        return this.successor.includes(dependency);
    }
    
    startsWith(source) {
        return (this.segment.source.task == source.task
                && this.segment.source.port == source.port);
    }

    toString() {
        const output = Utility.FormatDependencyString(this.segment);
        if (!this.successor) {
            return output;
        } else {
            return `${output} -> ${this.successor.toString()}`;
        }
    }
}
