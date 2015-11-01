export default class User {

    constructor(email, name, encryptedPassword, tasks = []) {
        this.email = email;
        this.name = name;
        this.encryptedPassword = encryptedPassword;
        this.tasks = tasks;
    }

    get firstName() {
        return this.name.split('\s+')[0];
    }

    get serialize() {
        return {
            name: this.name,
            email: this.email,
            password: this.encryptedPassword,
            tasks: this.tasks
        };
    }
}
