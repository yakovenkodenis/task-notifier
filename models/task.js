export default class Task {

    constructor(id, date, name, description) {
        this.id = id;
        this.deadline = date;
        this.name = name;
        this.description = description;
    }

    get serialize() {
        return {
            id: this.id,
            deadline: this.deadline,
            name: this.name,
            description: this.description
        }
    }
}
