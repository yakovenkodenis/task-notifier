export default class User {

    constructor(id, email, name, encryptedPassword) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.encryptedPassword = encryptedPassword;
    }

    get firstName() {
        return this.name.split('\s+')[0];
    }
}
