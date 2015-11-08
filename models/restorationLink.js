export default class RestorationLink {

    constructor(email, uuid, is_valid) {
        this.email = email;
        this.uuid = uuid;
        this.is_valid = is_valid;
    }

    get serialize() {
        return {
            email: this.email,
            uuid: this.uuid,
            is_valid: this.is_valid
        }
    }
}
