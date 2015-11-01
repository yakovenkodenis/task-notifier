export default class Session {

    constructor(user_id, session_id, is_valid = true,
                created_at = new Date().getTime(),
                updated_at = new Date().getTime()) {
        this.user_id = user_id;
        this.session_id = session_id;
        this.is_valid = is_valid;
        this.created_at = created_at;
        this.updated_at = updated_at;
    }

    get serialize() {
        return {
            user_id:    this.user_id,
            session_id: this.session_id,
            is_valid:   this.is_valid,
            created_at: this.created_at,
            updated_at: this.updated_at
        }
    }

    get cookie() {
        return `session_id=${this.session_id}`;
    }
}
