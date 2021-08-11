class ChainInstance {
    name = null;
    segment = null;    // Dependency instance
    successor = null;

    constructor(constraintName, dependency) {
        this.name = constraintName;
        this.segment = dependency;
    }
    
    static FromJson(json) {
        let chainInstance = new ChainInstance(json.name, json.segment);
                
        if (json.successor) {
            chainInstance.successor = ChainInstance.FromJson(json.successor);
        }
        
        return chainInstance;
    }
    
    get json() {
        let json = { segment: this.segment };
        
        if (this.name) {
            json['name'] = this.name;
        }
        
        if (this.successor) {
            json['successor'] = this.successor.json;
        }
        
        return json;
    }
    
    get copy() {
        let copy = new ChainInstance(this.name, this.segment);
        
        if (this.successor) {
            copy.successor = this.successor.copy;
        }
        
        return copy;
    }
    
    get name() {
        return this.name;
    }
    
    set name(name) {
        this.name = name;
    }
    
    get constraintName() {
        return this.name.split('-')[0];
    }
    
    get chainName() {
        const nameComponents = this.name.split('-');
        return `${nameComponents[0]}-${nameComponents[1]}`;
    }
    
    get variant() {
        return parseInt(this.name.split('-')[1]);
    }
    
    get instance() {
        return parseInt(this.name.split('-')[2]);
    }
    
    get segment() {
        return this.segment;
    }
    
    get successor() {
        return this.successor;
    }
    
    set successor(chainInstance) {
        if (this.successor) {
            alert('ChainInstance: Overwriting a successor!');
        }
        
        this.successor = chainInstance;
    }
    
    get last() {
        if (!this.successor) {
            return this;
        }
        
        return this.successor.last;
    }
    
    get maxLatency() {
        const startTime = this.segment.sendEvent.timestamp;
        const endTime = this.last.segment.receiveEvent.timestamp;
    
        return endTime - startTime;
    }
    
    // Generator function for visiting each segment in the chain instance
    * generator () {
        yield this.segment;
        
        if (this.successor) {
            yield* this.successor.generator();
        }       
    }

    toString() {
        const output = Utility.FormatDependencyInstanceString(this.segment);
        if (!this.successor) {
            return output;
        } else {
            return `${output} -> ${this.successor.toString()}`;
        }
    }
}