import AttributeContainer from "./AttributesContainer";

export default class UsersManager {
    #userMap = new Map();
    #users = new AttributeContainer();
    #userId = this.#users.addAttribute("userId");
    #userViewMatrix = this.#users.addAttribute("userViewMatrix");

    constructor ( ) {
		console.log("UsersManager - constructor");
    }

    addUser ( userId ) {
		console.log("UsersManager - addUser");

        const user = this.#users.newElement();
        this.#users.ref(user);

        this.#userId[user] = userId;
        this.#userMap.set(this.#userId[user], user);
    }

    getUser ( userId ) {
		console.log("UsersManager - getUser");
        
        return this.#userMap.get(userId);
    }
}