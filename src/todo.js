class ToDo {
    constructor(title, description, dueDate, priority, notes = '', checklist = []) {
        if (typeof title !== 'string') throw new TypeError('Title must be a string');
        if (typeof description !== 'string') throw new TypeError('Description must be a string');
        if (!(dueDate instanceof Date)) throw new TypeError('DueDate must be a Date object');
        if (typeof priority !== 'string') throw new TypeError('Priority must be a string');
        if (typeof notes !== 'string') throw new TypeError('Notes must be a string');
        if (!Array.isArray(checklist)) throw new TypeError('Checklist must be an array');

        this.title = title;
        this.description = description;
        this.dueDate = dueDate;
        this.priority = priority;
        this.notes = notes;
        this.checklist = checklist;
        this.completed = false;
    }

    toggleComplete() {
        this.completed = !this.completed;
    }

    update(details) {
        Object.assign(this, details);
    }

    edit(details) {
        Object.assign(this, details);
    }

    delete() {
        // This method can be used to handle any cleanup if necessary
    }
}

export default ToDo;