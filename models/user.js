export default class User {

    constructor(email, name, encryptedPassword) {
        this.email = email;
        this.name = name;
        this.encryptedPassword = encryptedPassword;
    }

    get firstName() {
        return this.name.split('\s+')[0];
    }

    get serialize() {
        return {
            name: this.name,
            email: this.email,
            password: this.encryptedPassword
        };
    }
}
